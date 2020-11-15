import React, { Component } from 'react';
import { IconButton, Typography } from '@material-ui/core';
import Sidemenu from '../MasterPage/Sidebar';
import twilio from 'twilio-video';
import '../../static/styles/VideoComponent.css';
import CallEndIcon from '@material-ui/icons/CallEnd';
import VideocamIcon from '@material-ui/icons/Videocam';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import VideocamOffIcon from '@material-ui/icons/VideocamOff';
import MicIcon from '@material-ui/icons/Mic';
import MicOffIcon from '@material-ui/icons/MicOff';
import addNotification from 'react-push-notification';
import Notify, { AlertTypes } from '../../services/Notify';
import Footer from '../MasterPage/Footer';
import avatar from '../../static/assets/avatar.png';
import StorageConfiguration from '../../services/StorageConfiguration';
import Environments from '../../services/Environments';
import { connect } from "react-redux";
import { withRouter } from "react-router";
import Sidebar from "react-sidebar";
import CloseIcon from '@material-ui/icons/Close';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import Loader from 'react-loader-spinner';
import Draggable from 'react-draggable';
import StreamIcon from '../../static/assets/sonography.png';
import $ from 'jquery';
import ReactPlayer from 'react-player';
import ReactModal from 'react-modal-resizable-draggable';

import { FormControl } from '@material-ui/core'
import ReactSelect from 'react-select';
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import FullScreen from 'react-request-fullscreen';
import closeicon from '../../static/assets/call-history-close.png';
import pin from '../../static/assets/pin.png';
import unpin from '../../static/assets/unpin.png';
import mute from '../../static/assets/mute.png';
import unmute from '../../static/assets/unmute.png';

// The current active Participant in the Room.
let activeParticipant = null;

// Whether the user has selected the active Participant by clicking on
// one of the video thumbnails.
let isActiveParticipantPinned = false;

// ConnectOptions settings for a video web application.
const connectOptions = {
	// Available only in Small Group or Group Rooms only. Please set "Room Type"
	// to "Group" or "Small Group" in your Twilio Console:
	// https://www.twilio.com/console/video/configure
	bandwidthProfile: {
		video: {
			dominantSpeakerPriority: 'high',
			mode: 'collaboration',
			renderDimensions: {
				high: { height: 720, width: 1280 },
				standard: { height: 90, width: 160 }
			}
		}
	},

	// Available only in Small Group or Group Rooms only. Please set "Room Type"
	// to "Group" or "Small Group" in your Twilio Console:
	// https://www.twilio.com/console/video/configure
	dominantSpeaker: true,

	audio: true,
	// Comment this line to disable verbose logging.
	// logLevel: 'debug',

	// Comment this line if you are playing music.
	maxAudioBitrate: 16000,

	// VP8 simulcast enables the media server in a Small Group or Group Room
	// to adapt your encoded video quality for each RemoteParticipant based on
	// their individual bandwidth constraints. This has no utility if you are
	// using Peer-to-Peer Rooms, so you can comment this line.
	preferredVideoCodecs: [{ codec: 'VP8', simulcast: true }],

	// Capture 720p video @ 24 fps.
	video: { height: 720, frameRate: 24, width: 1280 },

	name: ''
};


class VideoComponent extends Component {
	constructor(props) {
		super();
		this.state = {
			identity: null,
			roomName: '',
			token: '',
			roomNameErr: false, // Track error for room name TextField
			previewTracks: null,
			localMediaAvailable: false,
			hasJoinedRoom: false,
			activeRoom: '', // Track the current active room,

			audioTrack: true,
			videoTrack: true,
			physiciansList: [],
			checkedValues: [],
			isRoomJoined: false,
			searchValue: '',
			isOpenDraggable: false,
			timeout: null,

			modalIsOpen: false,
			streamingUrl: '',
			lastPinId: '',
			showMeetingEndPopup: false,
			selectedOption: '',
			deviceList: [],
			isDeviceChoosed: false,
			isWowza: false,
			activeParticipantIdentity: '',
			showOrganizerChange: false,
			changedHostId: '',
			showInputDevicePopup: false,
			isBlock: false,

			audioDeviceId: '',
			videoDeviceId: '',
			selectedAudio: null,
			selectedVideo: null,
			selectedOrganizer: null,
			selectedDevice: null,
			isFullScreen: false,
			showWowzaMainVideo: false,
			selectedParticipant: null,
			showConnectParticipantPopup: false,
			internetStatus: ''
		};
		this.leaveRoom = this.leaveRoom.bind(this);
		this.changeHost = this.changeHost.bind(this);

		this.showNotifications = this.showNotifications.bind(this);
		this.handleClick = this.handleClick.bind(this);

		this.onSetSidebarOpen = this.onSetSidebarOpen.bind(this);
		this.handleDiv = this.handleDiv.bind(this);
		this.closeDiv = this.closeDiv.bind(this);

		this.room = React.createRef();

		this.openModal = this.openModal.bind(this);
		this.closeModal = this.closeModal.bind(this);

		// Browser close event
		window.addEventListener("beforeunload", (ev) => {
			ev.preventDefault();
			return ev.returnValue = 'Are you sure you want to close?';
		});
		// Browser close event confirmation
		window.onunload = async (event) => {
			event.preventDefault();
			await this.leaveRoom('browserclose');
			window.close();
		};

		// Browser back event
		$(window).on('popstate', async (event) => {
			await this.leaveRoom();
		});

		// Browser full screen event
		if (document.addEventListener) {
			document.addEventListener("fullscreenchange", (ev) => {
				console.log('fullscreenchange', ev);
				this.exitHandler();
				return false;
			});

			document.addEventListener("mozfullscreenchange", (ev) => {
				this.exitHandler();
				return false;
			});

			document.addEventListener("MSFullscreenChange", (ev) => {
				this.exitHandler();
				return false;
			});

			document.addEventListener("webkitfullscreenchange", (ev) => {
				this.exitHandler();
				return false;
			});
		}

		// Browser offline event
		window.addEventListener("offline", (ev) => {
			this.setState({ internetStatus: 'offline' });
			Notify.sendNotification('Your internet connection lost', AlertTypes.success);
		});

		// Browser online event
		window.addEventListener("online", (ev) => {
			this.setState({ internetStatus: 'online' });
		});

	}

	exitHandler() {
		this.setState({ isFullScreen: false });
		if (!document.fullscreenElement && !document.webkitIsFullScreen && !document.mozFullScreen && !document.msFullscreenElement) {
			// Browser full screen event
			if (this.state.activeParticipantIdentity !== '') {
				let activeVideoElement = document.getElementById(this.state.activeParticipantIdentity + '-active-video');
				activeVideoElement.classList.remove("fullScreen");

				let activeShortNameElement = document.getElementById('active-short-name');
				activeShortNameElement.classList.remove("fullScreen");
			}
		}
	}

	componentDidMount() {
		this.setState({
			roomName: this.props.location.state.roomData.roomName, token: this.props.location.state.roomData.token,
			identity: this.props.location.state.roomData.identity
		});
		let deviceIds = {
			audio: StorageConfiguration.sessionGetItem('audioDeviceId'),
			video: StorageConfiguration.sessionGetItem('videoDeviceId')
		};
		if (deviceIds.audio === '' && deviceIds.video === '') {
			this.getMediaDeviceList();
		}
		else {
			this.setState({ isRoomJoined: true });
			this.joinRoom();
			let role = Number(StorageConfiguration.sessionGetItem('role'));
			if (role === 2) {
				this.getPhysicianList();
			}
			if (role !== 2 && this.props.location.state != null) {
				let clinicId = this.props.clinicId;
				this.getSonographerList(clinicId);
			}
		}

		this.unblock = this.props.history.block(targetLocation => {
			// take your action here
			this.handleMeetingEnd();
			return this.state.isBlock;
		});
		window.onhashchange = (e) => {
			e.preventDefault();
			this.handleMeetingEnd();
		}
	}

	connectRoom = () => {
		if (this.state.audioDeviceId !== '' && this.state.videoDeviceId !== '') {
			this.setState({ showInputDevicePopup: false, isRoomJoined: true });
			StorageConfiguration.sessionSetItem('audioDeviceId', this.state.audioDeviceId ? this.state.audioDeviceId : '');
			StorageConfiguration.sessionSetItem('videoDeviceId', this.state.videoDeviceId ? this.state.videoDeviceId : '');
			this.joinRoom();
			let role = Number(StorageConfiguration.sessionGetItem('role'));
			if (role === 2) {
				this.getPhysicianList();
			}
			if (role !== 2 && this.props.location.state != null) {
				let clinicId = this.props.clinicId;
				this.getSonographerList(clinicId);
			}
		}
		else {
			Notify.sendNotification('Please select the device', AlertTypes.success);
		}
	}

	async getMediaDeviceList() {
		let audioDevices = [];
		let videoDevices = [];
		await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
		let devices = await navigator.mediaDevices.enumerateDevices();
		for (const device of devices) {
			if (device.kind === 'audioinput') {
				audioDevices.push({
					label: device.label,
					value: device.deviceId
				});
			}
			if (device.kind === 'videoinput') {
				videoDevices.push({
					label: device.label,
					value: device.deviceId
				});
			}
		}
		this.setState({ audioDevices: audioDevices, videoDevices: videoDevices });
		this.setState({ showInputDevicePopup: true });

	}

	componentWillUnmount() {
		this.unblock();
	}

	setupParticipantContainer(participant, room) {

		let audioTrackEntries = participant.audioTracks.entries();
		let audioEntryValue = audioTrackEntries.next().value;
		let audioTrackFlag = audioEntryValue[1].isTrackEnabled;

		let videoTrackEntries = participant.videoTracks.entries();
		let videoEntryValue = videoTrackEntries.next().value;
		let videoTrackFlag = videoEntryValue[1].isTrackEnabled;


		const $participants = $(this.refs.participants);
		const { identity, sid } = participant;

		// Participant Short Name Card
		let particapantDetails = this.props.receipientsList.find(x => x.identity === Number(identity));
		// let participantName = particapantDetails.userName.split(' ');
		// let userShortName = participantName[0].charAt(0) + participantName[1].charAt(0);

		// Add a container for the Participant's media.
		const $container = $(`<div class="participant"  id="${sid}" style="z-index: -1">
		  <audio autoplay ${participant === room.localParticipant ? 'muted' : ''} style="opacity: 0"></audio>
		  <video id="${participant.identity}-participant-video" autoplay muted playsinline style="opacity: 0" ${videoTrackFlag === true ? 'style="display: inline-block"' : 'style="display: none"'}></video>

		  <div id="${participant.identity}-participant-short-name" class="short-name-card" ${videoTrackFlag === false ? 'style="display: inline-block"' : 'style="display: none"'}>
		  <img class="short-name-image" src="${particapantDetails.profilePic}">
		  </div>

		  <div class="remote-participants">
		  <span id="${participant.identity}-participant" class="participant-name-design">${particapantDetails.userName}</span>

		  <img id="${participant.identity}-audioMute" class="audioMute" ${audioTrackFlag === false ? 'style="display: inline-block"' : 'style="display: none"'}  src="${mute}">
		  <img id="${participant.identity}-audioUnMute" class="audioUnMute" ${audioTrackFlag === true ? 'style="display: inline-block"' : 'style="display: none"'} src="${unmute}">

		  <img id="${participant.identity}-pin" class="pinIcon" style="display: none" src="${pin}">
		  <img id="${participant.identity}-unPin" class="unpinIcon" src="${unpin}">
		  
		  </div>

		</div>`);

		// Toggle the pinning of the active Participant's video.
		$container.on('click', () => {
			// alert("Hello")

			if (activeParticipant === participant && isActiveParticipantPinned) {
				// Unpin the RemoteParticipant and update the current active Participant.
				this.setVideoPriority(participant, null);
				isActiveParticipantPinned = false;
				this.setCurrentActiveParticipant(room);
			} else {
				// Pin the RemoteParticipant as the active Participant.
				if (isActiveParticipantPinned) {
					this.setVideoPriority(activeParticipant, null);
				}
				this.setVideoPriority(participant, 'high');
				isActiveParticipantPinned = true;
				this.setActiveParticipant(participant);
			}
			this.togglePinUnPin(participant.identity, isActiveParticipantPinned);
		});

		// Add the Participant's container to the DOM.
		$participants.append($container)
	}

	setVideoPriority(participant, priority) {
		participant.videoTracks.forEach(publication => {
			const track = publication.track;
			if (track && track.setPriority) {
				track.setPriority(priority);
			}
		});
	}

	participantDisconnected(participant, room) {
		// If the disconnected Participant was pinned as the active Participant, then
		// unpin it so that the active Participant can be updated.
		if (activeParticipant === participant && isActiveParticipantPinned) {
			isActiveParticipantPinned = false;
			this.setCurrentActiveParticipant(room);
		}

		// Remove the Participant's media container.
		// $(`div#${participant.sid}`, participant).remove();
		document.getElementById(participant.sid).remove();
	}

	participantConnected(participant, room) {
		// Set up the Participant's media container.
		this.setupParticipantContainer(participant, room);

		// Handle the TrackPublications already published by the Participant.
		participant.tracks.forEach(publication => {
			this.trackPublished(publication, participant);
		});

		// Handle theTrackPublications that will be published by the Participant later.
		participant.on('trackPublished', publication => {
			this.trackPublished(publication, participant);
		});
	}

	trackPublished(publication, participant) {
		// If the TrackPublication is already subscribed to, then attach the Track to the DOM.
		if (publication.track) {
			this.attachTrack(publication.track, participant);
		}

		// Once the TrackPublication is subscribed to, attach the Track to the DOM.
		publication.on('subscribed', track => {
			this.attachTrack(track, participant);
		});

		// Once the TrackPublication is unsubscribed from, detach the Track from the DOM.
		publication.on('unsubscribed', track => {
			this.detachTrack(track, participant);
		});
	}

	attachTrack(track, participant) {

		const $participants = $(this.refs.participants);
		const $activeVideo = $(this.refs.activeVideo);
		// Attach the Participant's Track to the thumbnail.${track.kind}
		const $media = $participants.children(`div#${participant.sid}`);
		const $media1 = $media.children(`${track.kind}`)

		$media1.css("opacity", '');
		var value = track.attach();
		if (track.kind === 'video') {
			value.id = participant.identity + '-participant-video';
		}
		$media1.replaceWith(value);

		// If the attached Track is a VideoTrack that is published by the active
		// Participant, then attach it to the main video as well.
		if (track.kind === 'video' && participant === activeParticipant) {
			$activeVideo.replaceWith(track.attach());
			$activeVideo.css('opacity', '');
		}
	}

	detachTrack(track, participant) {
		const $participants = $(this.refs.participants);
		const $activeVideo = $(this.refs.activeVideo);
		// Detach the Participant's Track from the thumbnail.
		const $media = $participants.children(`div#${participant.sid} > ${track.kind}`);
		$media.css('opacity', '0');
		track.detach($media.get(0));

		// If the detached Track is a VideoTrack that is published by the active
		// Participant, then detach it from the main video as well.
		if (track.kind === 'video' && participant === activeParticipant) {
			track.detach($activeVideo.get(0));
			$activeVideo.css('opacity', '0');
		}
	}

	setCurrentActiveParticipant(room) {
		const { dominantSpeaker, localParticipant } = room;
		this.setActiveParticipant(dominantSpeaker || localParticipant);
	}

	setActiveParticipant(participant) {
		const $participants = $(this.refs.participants);
		const $activeVideo = $(this.refs.activeVideo);
		let particapantDetails = this.props.receipientsList.find(x => x.identity === Number(participant.identity));
		if (activeParticipant) {
			const $activeParticipant = $(`div#${activeParticipant.sid}`, $participants);
			$activeParticipant.removeClass('active');
			$activeParticipant.removeClass('pinned');

			// Detach any existing VideoTrack of the active Participant.
			const { track: activeTrack } = Array.from(activeParticipant.videoTracks.values())[0] || {};
			if (activeTrack) {
				activeTrack.detach($activeVideo.get(0));
				$activeVideo.css('opacity', '0');
			}
		}

		// Set the new active Participant.
		activeParticipant = participant;
		const { identity, sid } = participant;
		const $participant = $participants.children(`div#${sid}`);

		$participant.addClass('active');
		if (isActiveParticipantPinned) {
			$participant.addClass('pinned');
		}

		// Attach the new active Participant's video.
		const { track } = Array.from(participant.videoTracks.values())[0] || {};
		if (track) {
			track.attach($activeVideo.get(0));
			$activeVideo.css('opacity', '');
		}

		const $activeParticipant = $(this.refs.activeParticipant);

		// Participant Name
		let oldActiveParticipantName = document.getElementById('active-name');
		if (oldActiveParticipantName !== null) {
			oldActiveParticipantName.remove();
		}
		this.setState({ activeParticipantIdentity: identity });
		$activeParticipant.append(`<span id="active-name" class="participant-name">${particapantDetails.userName}</span>`);

		$activeParticipant.attr('id', identity + '-active-video-container');
		let parent = document.getElementById(identity + '-active-video-container');
		let children = parent.childNodes[0];
		children.id = identity + '-active-video';

		let oldActiveName = document.getElementById('active-short-name');
		if (oldActiveName !== null) {
			oldActiveName.remove();
		}

		let videoTrackEntries = participant.videoTracks.entries();
		let videoEntryValue = videoTrackEntries.next().value;
		let videoTrackFlag = videoEntryValue[1].isTrackEnabled;

		$activeParticipant.append(`<div id="active-short-name" class="active-short-name-card" ${videoTrackFlag === false ? 'style="display: inline-block"' : 'style="display: none"'}><img id="profile-image" class="active-short-name-image" src="${particapantDetails.profilePic}"></div>`);

		// Toggle the active video and short name
		// let indexValue = this.props.receipientsList.findIndex(x => x.userId === Number(identity));
		// if (indexValue !== -1) {
		// let currentRecipients = this.props.receipientsList[indexValue];
		let activeVideoElement = document.getElementById(participant.identity + '-active-video');
		let activeShortNameElement = document.getElementById('active-short-name');

		let profileImageElement = document.getElementById('profile-image');
		if (this.state.isWowza === true) {
			activeShortNameElement.classList.add("wowza-shortname");
			profileImageElement.classList.add("wowza-short-name-image");
		}

		if (videoTrackFlag === true) {
			if (activeVideoElement !== null) {
				this.toggleVideoShortName('video', activeVideoElement, activeShortNameElement);
			}
		}
		if (videoTrackFlag === false) {
			if (activeVideoElement !== null) {
				this.toggleVideoShortName('shortName', activeVideoElement, activeShortNameElement);
			}
		}
		// }
	}

	async joinRoom() {
		if (!this.props.location.state.roomData.roomName.trim()) {
			this.setState({ roomNameErr: true });
			return;
		}

		let deviceIds = {
			audio: StorageConfiguration.sessionGetItem('audioDeviceId'),
			video: StorageConfiguration.sessionGetItem('videoDeviceId')
		};

		// Add the specified audio device ID to ConnectOptions.
		connectOptions.audio = { deviceId: { exact: deviceIds.audio } };
		// Add the specified video device ID to ConnectOptions.
		connectOptions.video.deviceId = { exact: deviceIds.video };

		connectOptions.name = this.props.location.state.roomData.roomName
		const room = await twilio.connect(this.props.location.state.roomData.token, connectOptions);
		this.setState({ isRoomJoined: false });
		this.setState({
			activeRoom: room,
			localMediaAvailable: true,
			hasJoinedRoom: true
		});
		let localVideoTrack = Array.from(room.localParticipant.videoTracks.values())[0].track;
		console.log('localVideoTrack', localVideoTrack);
		// Make the Room available in the JavaScript console for debugging.
		window.room = room;

		// User Status
		let id = Number(StorageConfiguration.sessionGetItem('userId'));
		let userdata = {
			id: id,
			status: 'busy'
		}
		this.props.sendUserStatus(userdata);

		//Handle the LocalParticipant's media.
		this.participantConnected(room.localParticipant, room);;

		//Subscribe to the media published by RemoteParticipants already in the Room.
		room.participants.forEach(participant => {
			this.participantConnected(participant, room);
		});

		// Subscribe to the media published by RemoteParticipants joining the Room later.
		room.on('participantConnected', participant => {
			this.participantConnected(participant, room);
			let joinedParticapantDetails = this.props.receipientsList.find(x => x.identity === Number(participant.identity));
			if (joinedParticapantDetails !== undefined) {
				Notify.sendNotification(joinedParticapantDetails.userName + ' joined', AlertTypes.success);
			}
		});

		// Handle a disconnected RemoteParticipant.
		room.on('participantDisconnected', participant => {
			this.participantDisconnected(participant, room);
			let data = {
				userId: Number(participant.identity),
				roomId: this.props.roomDetails.room_name
			}
			let disconnectedParticapantDetails = this.props.receipientsList.find(x => x.identity === Number(participant.identity));
			if (disconnectedParticapantDetails !== undefined) {
				Notify.sendNotification(disconnectedParticapantDetails.userName + ' left', AlertTypes.success);
			}
			this.props.removeRecipients(data);
		});

		// Set the current active Participant.
		this.setCurrentActiveParticipant(room);

		// Update the active Participant when changed, only if the user has not
		// pinned any particular Participant as the active Participant.
		room.on('dominantSpeakerChanged', () => {
			if (!isActiveParticipantPinned) {
				this.setCurrentActiveParticipant(room);
			}
		});

		// When a Participant disabled a Track
		room.on('trackDisabled', (track, participant) => {
			let trackDisabledDetails = this.props.receipientsList.find(x => x.identity === Number(participant.identity));
			if (trackDisabledDetails !== undefined) {
				if (track.kind === 'audio') {
					Notify.sendNotification(trackDisabledDetails.userName + ' muted ' + track.kind, AlertTypes.success);
				}
				if (track.kind === 'video') {
					Notify.sendNotification(trackDisabledDetails.userName + ' disabled ' + track.kind, AlertTypes.success);
				}
			}
			if (track.kind === 'audio') {
				this.audioMuteUnMute('disabled', participant.identity);
			}
			if (track.kind === 'video') {
				this.handleTrackEnabledDisabled('shortName', participant.identity);
				// Updating participant video
				this.updateParticipantVideoStatus(false, participant.identity);
			}
		});

		// When a Participant disabled a Track
		room.on('trackEnabled', (track, participant) => {
			let trackEnabledDetails = this.props.receipientsList.find(x => x.identity === Number(participant.identity));
			if (trackEnabledDetails !== undefined) {
				if (track.kind === 'audio') {
					Notify.sendNotification(trackEnabledDetails.userName + ' unmuted ' + track.kind, AlertTypes.success);
				}
				if (track.kind === 'video') {
					Notify.sendNotification(trackEnabledDetails.userName + ' enabled ' + track.kind, AlertTypes.success);
				}
			}
			if (track.kind === 'audio') {
				this.audioMuteUnMute('enabled', participant.identity);
			}

			if (track.kind === 'video') {
				this.handleTrackEnabledDisabled('video', participant.identity);
				// Updating participant video status enabled or not
				this.updateParticipantVideoStatus(true, participant.identity);
			}
		});

		room.on('disconnected', () => {
			if (this.state.previewTracks) {
				this.state.previewTracks.forEach(track => {
					track.stop();
				});
			}
			let role = Number(StorageConfiguration.sessionGetItem('role'));
			if (role !== 2) {
				this.props.history.push('/my-clinic');
			}
			if (role === 2) {
				this.props.history.push('/all-physicians');
			}
			this.setState({ activeRoom: null });
			this.setState({ hasJoinedRoom: false, localMediaAvailable: false });
		});

	}

	audioMuteUnMute(type, identity) {
		let muteElement = $(`#${identity}-audioMute`)[0];
		let unMuteElement = $(`#${identity}-audioUnMute`)[0];
		this.toggleMuteUnMute(type, muteElement, unMuteElement);
	}

	handleTrackEnabledDisabled(type, identity) {
		let videoElement = document.getElementById(identity + '-participant-video');
		let shortNameElement = document.getElementById(identity + '-participant-short-name');
		this.toggleVideoShortName(type, videoElement, shortNameElement);

		let activeVideoElement = document.getElementById(identity + '-active-video');
		let activeShortNameElement = document.getElementById('active-short-name');
		if (activeVideoElement !== null) {
			this.toggleVideoShortName(type, activeVideoElement, activeShortNameElement);
		}
	}

	//  Mute and UnMute Style Toggle Function
	toggleMuteUnMute(type, muteElement, unMuteElement) {
		if (type === 'disabled') {
			muteElement.style.display = "inline-block";
			unMuteElement.style.display = "none";
		}
		if (type === 'enabled') {
			muteElement.style.display = "none";
			unMuteElement.style.display = "inline-block";
		}
	}

	updateParticipantVideoStatus(event, identity) {
		let indexValue = this.props.receipientsList.findIndex(x => x.userId === Number(identity));
		if (indexValue !== -1) {
			let currentRecipients = this.props.receipientsList;
			currentRecipients[indexValue].isVideo = event;
			this.props.saveRecipients(currentRecipients);
		}
	}

	//  Local Audio Enable and Disable
	audio = () => {
		this.setState({ audioTrack: !this.state.audioTrack });
		if (this.state.activeRoom !== '') {
			var localParticipant = this.state.activeRoom.localParticipant;
			localParticipant.audioTracks.forEach((audioTrack) => {
				let muteElement = document.getElementById(localParticipant.identity + '-audioMute');
				let unMuteElement = document.getElementById(localParticipant.identity + '-audioUnMute');
				if (audioTrack.track.isEnabled === true) {
					audioTrack.track.disable();
					Notify.sendNotification('You are muted audio', AlertTypes.success);
					this.toggleMuteUnMute('disabled', muteElement, unMuteElement);
				} else {
					audioTrack.track.enable();
					Notify.sendNotification('You are unmuted audio', AlertTypes.success);
					this.toggleMuteUnMute('enabled', muteElement, unMuteElement);
				}
			});
		}
	}

	//  Local Video Enable and Disable
	video = () => {
		this.setState({ videoTrack: !this.state.videoTrack });
		if (this.state.activeRoom !== '') {
			var localParticipant = this.state.activeRoom.localParticipant;
			localParticipant.videoTracks.forEach((videoTracks) => {
				if (videoTracks.track.isEnabled === true) {
					videoTracks.track.disable();
					Notify.sendNotification('You are disabled video', AlertTypes.success);
					// Updating participant video
					let indexValue = this.props.receipientsList.findIndex(x => x.userId === Number(localParticipant.identity));
					if (indexValue !== -1) {
						let currentRecipients = this.props.receipientsList;
						currentRecipients[indexValue].isVideo = false;
						this.props.saveRecipients(currentRecipients);
						// Toggle local participant video / short name
						this.localParticipantActiveVideoShortNameToggle('shortName', localParticipant.identity);
						this.localParticipantVideoShortNameToggle('shortName', localParticipant.identity);
					}
				} else {
					videoTracks.track.enable();
					Notify.sendNotification('You are enabled video', AlertTypes.success);
					// Updating participant video
					let indexValue = this.props.receipientsList.findIndex(x => x.userId === Number(localParticipant.identity));
					if (indexValue !== -1) {
						let currentRecipients = this.props.receipientsList;
						currentRecipients[indexValue].isVideo = true;
						this.props.saveRecipients(currentRecipients);
						// Toggle local participant video / short name
						this.localParticipantActiveVideoShortNameToggle('video', localParticipant.identity);
						this.localParticipantVideoShortNameToggle('video', localParticipant.identity);
					}
				}
			});
		}
	}

	// Toggle local active participant video / short name
	localParticipantActiveVideoShortNameToggle(type, identity) {
		let activeVideoElement = document.getElementById(identity + '-active-video');
		let activeShortNameElement = document.getElementById('active-short-name');
		if (activeVideoElement !== null) {
			this.toggleVideoShortName(type, activeVideoElement, activeShortNameElement);
		}
	}

	// Toggle local participant video / short name
	localParticipantVideoShortNameToggle(type, identity) {
		let participantVideoElement = document.getElementById(identity + '-participant-video');
		let participantShortNameElement = document.getElementById(identity + '-participant-short-name');
		if (participantVideoElement !== null) {
			this.toggleVideoShortName(type, participantVideoElement, participantShortNameElement);
		}
	}

	//  Change Meeting Host
	async changeHost() {
		if (this.state.internetStatus === 'offline') {
			let role = Number(StorageConfiguration.sessionGetItem('role'));
			if (role !== 2) {
				this.props.history.push('/my-clinic');
			}
			if (role === 2) {
				this.props.history.push('/all-physicians');
			}
		}
		else {
			if (this.state.changedHostId !== '') {
				let indexValue = this.props.receipientsList.findIndex(x => x.userId === Number(this.state.changedHostId));
				if (indexValue !== -1) {
					let currentRecipients = this.props.receipientsList;
					currentRecipients[indexValue].role = 'Host';
					let data = {};
					data.room = {
						roomName: this.props.roomDetails.room_name,
					}
					data.recepientsInfo = [...currentRecipients];
					await this.props.reAssignOrganizer(data);
				}
				await this.leaveRoom();
			}
			else {
				Notify.sendNotification('Please select the host', AlertTypes.success);
			}
		}
	}

	//  Leave Room Function
	leaveRoom(value) {
		if (this.state.internetStatus === 'offline') {
			let role = Number(StorageConfiguration.sessionGetItem('role'));
			if (role !== 2) {
				this.props.history.push('/my-clinic');
			}
			if (role === 2) {
				this.props.history.push('/all-physicians');
			}
		}
		else {
			if (this.state.activeRoom !== '' && this.state.activeRoom !== null) {

				this.state.activeRoom.disconnect();
				this.setState({ hasJoinedRoom: false, localMediaAvailable: false });

				// User Status
				let id = Number(StorageConfiguration.sessionGetItem('userId'));
				let userdata = {};
				if (value === 'browserclose') {
					userdata = {
						id: id,
						status: 'offline'
					}
				}
				else {
					userdata = {
						id: id,
						status: 'online'
					}
				}
				this.props.sendUserStatus(userdata);

				let data = {
					userId: Number(StorageConfiguration.sessionGetItem('userId')),
					roomId: this.props.roomDetails.room_name
				}
				this.props.removeRecipients(data);

				// Streaming Closed
				let currentUserId = Number(StorageConfiguration.sessionGetItem('userId'));
				let checkStreaming = this.isEmpty(this.props.streamingData);
				if (checkStreaming === false) {
					if (Number(this.props.streamingData.initiatedById) === currentUserId) {
						this.streamingClosed();
					}
				}
			}
		}
	}

	streamingClosed() {
		const streaming = Environments.getAPI('streamingClosed?stream_id=' + this.props.streamingData.streamingId)
		streaming.then(res => {
			Notify.sendNotification('Live streaming closed', AlertTypes.success);
		});
	}

	streamingDeviceIsActiveForOneToOne() {
		let currentUserId = Number(StorageConfiguration.sessionGetItem('userId'));
		const deviceUpdate = Environments.postAPI('device-is-active?device_id' + this.props.streamingData.deviceId
			+ '&from_id='
			+ currentUserId
			+ '&to_id='
			+ this.props.receipientsList[1].userId
		)
		deviceUpdate.then(res => {
			console.log('res', res);
		});
	}

	streamingDeviceIsActiveForOneToMany() {
		let toId = [];
		let currentUserId = Number(StorageConfiguration.sessionGetItem('userId'));
		for (const element of this.props.receipientsList) {
			if (currentUserId !== Number(element.userId)) {
				toId.push(String(element.userId));
			}
		}
		let dataModal = {
			device_id: this.props.streamingData.deviceId,
			from_id: currentUserId,
			to_id: toId
		}
		const deviceUpdate = Environments.postAPI('device-is-active1', dataModal)
		deviceUpdate.then(res => {
			console.log('res', res);
		});
	}

	//  Physicians list GET Service
	getPhysicianList() {
		const getPhysicianList = Environments.getAPI('list-physician')
		getPhysicianList.then(res => {
			const physician = res.data.data.physicians.data;
			this.setState({ physiciansList: physician, pageSize: Math.ceil(Number(res.data.data.physicians.total / 10)) });
		});
	}

	//  Sonographer list GET Service
	getSonographerList(clinicId) {
		const getTechnicianList = Environments.getAPI('list-technician/' + clinicId)
		getTechnicianList.then(res => {
			const physician = res.data.data.technician.data;
			this.setState({ physiciansList: physician, pageSize: Math.ceil(Number(res.data.data.technician.total / 10)) });
		});
	}

	//  Device List GET Service
	getDeviceList() {
		const getDevice = Environments.postAPI('deviceList?clinic_id=' + this.props.clinicId)
		getDevice.then(res => {
			const device = res.data.data.devices;
			let deviceList = [];
			for (const element of device) {
				deviceList.push({
					value: element.id,
					label: element.device_name
				})
			}
			console.log('deviceList', deviceList);
			this.setState({ deviceList: deviceList });
		});
	}

	onStreamingUrlChange = selectedDevice => {
		this.setState({ selectedOption: selectedDevice.value, selectedDevice });
	}

	getStreamUrl = () => {
		if (this.state.selectedOption !== '') {
			if (this.props.receipientsList.length <= 2) {
				this.getWowzaStreamingUrlForOneToOne(this.state.selectedOption);
			}
			else {
				this.getWowzaStreamingUrlForOneToMany(this.state.selectedOption);
			}
		}
		else {
			Notify.sendNotification('Please select device', AlertTypes.success);
		}
	}

	//  GET Streaming URL
	getWowzaStreamingUrlForOneToOne(deviceId) {
		let currentUserId = StorageConfiguration.sessionGetItem('userId');
		const getWowza = Environments.postAPI('wowza?clinic_id=' + this.props.clinicId
			+ '&device_id='
			+ deviceId
			+ '&from_id='
			+ currentUserId
			+ '&to_id='
			+ this.props.receipientsList[1].userId
		)
		getWowza.then(res => {
			console.log('res_url', res);
			this.setState({ streamingUrl: 'http://3.16.58.57:1935/Dallas_TX_191/dallas_clinic_stream_054/manifest.mpd?D0TxdbleDMXr2hRhash=fCXy3wVygG4s5tvumWCZOa09raz9KCVYtW3zuvovVaPfcNQMJVt17D1CK9NfPoZ9CfchnBkH86nWgy3ZgVNF7A==', streamingId: res.data.data.id });
			// this.setState({ isDeviceChoosed: false, isOpenDraggable: true });
			this.setState({ isDeviceChoosed: false, modalIsOpen: true });
			this.setState({ showWowzaMainVideo: true });

			localStorage.setItem('wowza', res.data.url);

			let userName = StorageConfiguration.sessionGetItem('userName');
			let userId = StorageConfiguration.sessionGetItem('userId');
			let streamingData = {
				roomId: this.props.roomDetails.room_name,
				deviceId: deviceId,
				streamingUrl: 'http://3.16.58.57:1935/Dallas_TX_191/dallas_clinic_stream_054/manifest.mpd?D0TxdbleDMXr2hRhash=fCXy3wVygG4s5tvumWCZOa09raz9KCVYtW3zuvovVaPfcNQMJVt17D1CK9NfPoZ9CfchnBkH86nWgy3ZgVNF7A==',
				streamingId: res.data.data.stream_id,
				initiatedById: userId,
				initiatedByName: userName
			}
			this.props.sendStreamingUrl(streamingData);
		});
	}

	//  GET Streaming URL
	getWowzaStreamingUrlForOneToMany(deviceId) {
		let toIdValues = [];
		let currentUserId = StorageConfiguration.sessionGetItem('userId');
		for (const element of this.props.receipientsList) {
			if (String(currentUserId) !== String(element.userId)) {
				toIdValues.push(String(element.userId));
			}
		}
		let toId = toIdValues;
		let dataModal = {
			clinic_id: this.props.clinicId,
			device_id: deviceId,
			from_id: currentUserId,
			to_id: toId
		}
		console.log('dataModal', dataModal);
		const getWowza = Environments.postAPI('wowza1', dataModal);
		getWowza.then(res => {
			console.log('res_url', res);
			this.setState({ streamingUrl: 'http://3.16.58.57:1935/Dallas_TX_191/dallas_clinic_stream_054/manifest.mpd?D0TxdbleDMXr2hRhash=fCXy3wVygG4s5tvumWCZOa09raz9KCVYtW3zuvovVaPfcNQMJVt17D1CK9NfPoZ9CfchnBkH86nWgy3ZgVNF7A==', streamingId: res.data.data.id });
			// this.setState({ isDeviceChoosed: false, isOpenDraggable: true });
			this.setState({ isDeviceChoosed: false, modalIsOpen: true });
			this.setState({ showWowzaMainVideo: true });

			localStorage.setItem('wowza', res.data.url);

			let userName = StorageConfiguration.sessionGetItem('userName');
			let userId = StorageConfiguration.sessionGetItem('userId');
			let streamingData = {
				roomId: this.props.roomDetails.room_name,
				deviceId: deviceId,
				streamingUrl: 'http://3.16.58.57:1935/Dallas_TX_191/dallas_clinic_stream_054/manifest.mpd?D0TxdbleDMXr2hRhash=fCXy3wVygG4s5tvumWCZOa09raz9KCVYtW3zuvovVaPfcNQMJVt17D1CK9NfPoZ9CfchnBkH86nWgy3ZgVNF7A==',
				streamingId: res.data.data.stream_id,
				initiatedById: userId,
				initiatedByName: userName
			}
			this.props.sendStreamingUrl(streamingData);
		});
	}

	handleDiv = () => {
		let role = Number(StorageConfiguration.sessionGetItem('role'));
		if (role === 2) {
			if (this.state.streamingUrl === '') {
				this.setState({ isDeviceChoosed: true });
				this.getDeviceList();
			}
			else {
				this.setState({ isOpenDraggable: true });
			}
		}
		if (role !== 2) {
			let checkStreamingUrl = this.isEmpty(this.props.streamingData);
			if (checkStreamingUrl === false) {
				this.setState({ streamingUrl: this.props.streamingData.streamingUrl });
				this.setState({ isOpenDraggable: true });
				this.setState({ isWowza: false });
			}
			else {
				Notify.sendNotification('Live streaming not enabled', AlertTypes.success);
			}
		}
	}

	closeDevicePopup = () => {
		this.setState({ isDeviceChoosed: false });
		this.setState({ selectedOption: '' });
	}

	// Close Sidenav
	closeDiv = () => {
		this.setState({ isOpenDraggable: false })
	}

	onTodoChange(value) {
		this.setState({
			searchValue: value
		});
	}

	//  Search Participants GET Service
	searchPhysiciansList = () => {
		let role = Number(StorageConfiguration.sessionGetItem('role'));
		if (role === 2) {
			const getPhysicianList = Environments.getAPI('list-physician?search=' + this.state.searchValue)
			getPhysicianList.then(res => {
				const physician = res.data.data.physicians.data;
				this.setState({ physiciansList: physician, pageSize: Math.ceil(Number(res.data.data.physicians.total / 10)) });
			});
		}
		if (role !== 2 && this.props.location.state != null) {
			let clinicId = this.props.clinicId;
			const getTechnicianList = Environments.getAPI('list-technician/' + clinicId + '?search=' + this.state.searchValue)
			getTechnicianList.then(res => {
				const physician = res.data.data.technician.data;
				this.setState({ physiciansList: physician, pageSize: Math.ceil(Number(res.data.data.technician.total / 10)) });
			});
		}
	}

	notificationClick() {

	}

	buttonClick = () => {
		addNotification({
			title: 'Notification Demo',
			subtitle: 'This is the body of the Notification',
			message: 'This is the body of the Notification',
			theme: 'darkblue',
			onClick: this.notificationClick,
			duration: 30000, //optional, default: 5000,
			backgroundTop: 'green', //optional, background color of top container.
			backgroundBottom: 'darkgreen', //optional, background color of bottom container.
			colorTop: 'green', //optional, font color of top container.
			colorBottom: 'darkgreen', //optional, font color of bottom container.
			closeButton: 'Go away', //optional, text or html/jsx element for close text. Default: Close,
			native: true, // when using native, your OS will handle theming.
			icons: '../../static/assets/icon.jpg',
		});
	};

	showNotification() {
		var options = {
			body: "This is the body of the Notification",
			icon: "https://images.pexels.com/photos/853168/pexels-photo-853168.jpeg?    auto=compress&cs=tinysrgb&dpr=1&w=500",
			dir: "ltr"
		};
		var notification = new Notification("Notification Demo", options);
		console.log('notification', notification);
	}


	showNotifications() {
		// If the Notifications API is supported by the browser
		// then show the notification
		if (this.n.supported()) this.n.show();
	}

	handleClick(event) {
		// Do something here such as
		// console.log("Notification Clicked") OR
		// window.focus() OR
		// window.open("http://www.google.com")

		// Lastly, Close the notification
		this.n.close(event.target.tag);
	}

	closeConnectParticipantPopup = () => {
		this.setState({ showConnectParticipantPopup: false });
	}

	//  Search Participants Autocomplete function
	handleautocomplete = (object, value) => {
		if (value !== null) {
			this.setState({ selectedParticipant: value, showConnectParticipantPopup: true });
		}
	};

	connectParticipant = () => {
		if (this.state.selectedParticipant !== null) {
			let checkCurrentlyInMeeting = this.props.receipientsList.filter(x => x.userId === this.state.selectedParticipant.id && x.status === 'attended');
			let checkCurrentlyInMeetingDeclained = this.props.receipientsList.filter(x => x.userId === this.state.selectedParticipant.id && (x.status === 'declined' || x.status === 'No Response'));
			if (checkCurrentlyInMeeting.length === 0) {
				let data = {};
				let callerId = StorageConfiguration.sessionGetItem('userId');
				let callerName = StorageConfiguration.sessionGetItem('userName');
				let profilePic = StorageConfiguration.sessionGetItem('profilePic');
				data.room = {
					roomName: this.props.roomDetails.room_name,
				}
				data.callerInfo = {
					callerId: callerId,
					callerName: callerName,
					profilePic: profilePic,
					isRoomStarted: true
				}
				let currentParticipants = this.props.receipientsList.filter(x => x.roomId === this.props.roomDetails.room_name);
				let recepientsList = [
					{
						userId: this.state.selectedParticipant.id,
						identity: this.state.selectedParticipant.id,
						userName: this.state.selectedParticipant.first_name + ' ' + this.state.selectedParticipant.last_name,
						profilePic: this.state.selectedParticipant.profile_pic ? this.state.selectedParticipant.profile_pic : avatar,
						status: 'Calling',
						roomId: this.props.roomDetails.room_name,
						role: 'Participant',
						isVideo: true
					}
				];
				data.recepientsInfo = [...currentParticipants, ...recepientsList];
				this.props.sendMessage(data);
				this.timer(this.state.selectedParticipant.id);
			}
			if (checkCurrentlyInMeeting.length > 0) {
				Notify.sendNotification('This user already in meeting', AlertTypes.warn);
			}
			if (checkCurrentlyInMeetingDeclained.length > 0) {
				let data = {};
				let callerId = StorageConfiguration.sessionGetItem('userId');
				let callerName = StorageConfiguration.sessionGetItem('userName');
				let profilePic = StorageConfiguration.sessionGetItem('profilePic');
				data.room = {
					roomName: this.props.roomDetails.room_name,
				}
				data.callerInfo = {
					callerId: callerId,
					callerName: callerName,
					profilePic: profilePic,
					isRoomStarted: true
				}
				let currentParticipants = this.props.receipientsList.filter(x => x.roomId === this.props.roomDetails.room_name);
				let idToUpdate = Number(this.state.selectedParticipant.id);
				let index = currentParticipants.map(function (item) {
					return item.identity
				}).indexOf(idToUpdate);
				if (index !== -1) {
					let data = currentParticipants;
					data[index].status = 'Calling';
				}
				data.recepientsInfo = [...currentParticipants];
				this.props.sendMessage(data);
				this.timer(this.state.selectedParticipant.id);
			}
		}
		this.setState({ showConnectParticipantPopup: false });
	};

	//  Call No Response Timer
	timer(userId) {
		this.setState({
			timeout: setTimeout(res => {
				let indexValue = this.props.receipientsList.findIndex(x => x.userId === userId);
				if (indexValue !== -1) {
					if (this.props.receipientsList[indexValue].status === 'Calling') {
						let currentRecipients = this.props.receipientsList;
						currentRecipients[indexValue].status = 'No Response';
						this.props.saveRecipients(currentRecipients);
						Notify.sendNotification('User not available', AlertTypes.warn);
					}
				}
			}, 70000)
		});
	}

	//  Call Retry Event
	callRetry = (value) => {
		let data = {};
		let callerId = StorageConfiguration.sessionGetItem('userId');
		let callerName = StorageConfiguration.sessionGetItem('userName');
		let profilePic = StorageConfiguration.sessionGetItem('profilePic');
		data.room = {
			roomName: this.props.roomDetails.room_name,
		}
		data.callerInfo = {
			callerId: callerId,
			callerName: callerName,
			profilePic: profilePic,
			isRoomStarted: true
		}
		let currentParticipants = this.props.receipientsList.filter(x => x.roomId === this.props.roomDetails.room_name);
		let idToUpdate = Number(value.identity);
		let index = currentParticipants.map(function (item) {
			return item.identity
		}).indexOf(idToUpdate);
		if (index !== -1) {
			let data = currentParticipants;
			data[index].status = 'Calling';
		}
		data.recepientsInfo = [...currentParticipants];
		this.props.sendMessage(data);
		this.timer(value.identity);
	}

	// Open sidenav
	onSetSidebarOpen(open) {
		this.setState({ sidebarOpen: open });
		let role = Number(StorageConfiguration.sessionGetItem('role'));
		if (role === 2) {
			this.getPhysicianList();
		}
		if (role !== 2 && this.props.location.state != null) {
			let clinicId = this.props.clinicId;
			this.getSonographerList(clinicId);
		}
	}

	toggleVideoShortName(type, videoElement, shortNameElement) {
		if (videoElement !== null && shortNameElement !== null) {
			if (type === 'shortName') {
				shortNameElement.style.display = "inline-block";
				videoElement.style.display = "none";
			}
			if (type === 'video') {
				shortNameElement.style.display = "none";
				videoElement.style.display = "inline-block";
			}
		}
	}

	toggleShowHideShortName(type, shortNameElement) {
		if (shortNameElement !== null) {
			if (type === 'shortName') {
				shortNameElement.style.display = "inline-block";
			} if (type === 'video') {
				shortNameElement.style.display = "none";
			}
		}
	}

	// Toggle Pin and UnPin Implementations
	togglePinUnPin(identity, type) {
		let pinElement = document.getElementById(identity + '-pin');
		let unPinElement = document.getElementById(identity + '-unPin');
		if (type === true) {
			pinElement.style.display = "inline-block";
			unPinElement.style.display = "none";
		}
		if (type === false) {
			pinElement.style.display = "none";
			unPinElement.style.display = "inline-block";
		}
		let lastPinId = this.state.lastPinId;
		if (Number(lastPinId) !== Number(identity)) {
			let pinElement = document.getElementById(lastPinId + '-pin');
			let unPinElement = document.getElementById(lastPinId + '-unPin');
			if (pinElement !== null && unPinElement !== null) {
				pinElement.style.display = "none";
				unPinElement.style.display = "inline-block";
			}
		}
		this.setState({ lastPinId: identity });
	}

	handleMeetingEnd = () => {
		// Organizer Change
		let currentUserId = Number(StorageConfiguration.sessionGetItem('userId'));
		let isOrganizer = this.props.receipientsList.filter(x => Number(x.userId) === currentUserId && x.role === 'Host');
		if (isOrganizer.length > 0 && this.props.receipientsList.length > 1) {
			this.setState({ showOrganizerChange: true });
		}
		else {
			this.setState({ showMeetingEndPopup: true });
		}
		this.setState({ isBlock: true });
	}

	onOrganizerChange = selectedOrganizer => {
		this.setState({ changedHostId: selectedOrganizer.value, selectedOrganizer });
	}

	handleOrganizerClose = () => {
		this.setState({ showOrganizerChange: false, changedHostId: '' });
		this.setState({ isBlock: false });
	}

	handleMeetingClose = () => {
		this.setState({ showMeetingEndPopup: false });
	}

	isEmpty(obj) {
		for (var key in obj) {
			if (obj.hasOwnProperty(key))
				return false;
		}
		return true;
	}

	onAudioChange = selectedAudio => {
		this.setState({ audioDeviceId: selectedAudio.value, selectedAudio });
		console.log(`Option selected:`, selectedAudio);
	}

	onVideoChange = selectedVideo => {
		this.setState({ videoDeviceId: selectedVideo.value, selectedVideo });
		console.log(`Option selected:`, selectedVideo);
	}

	toggleWowza = () => {
		// let activeVideoElement = document.getElementById(this.state.activeParticipantIdentity + '-active-video');
		// let shortNameElement = document.getElementById('active-short-name');
		// let wowzaElement = document.getElementById('active-wowza');
		// let profileImageElement = document.getElementById('profile-image');
		// this.setState({ isWowza: !this.state.isWowza });
		// if (this.state.isWowza === false) {
		// 	wowzaElement.style.display = "inline-block";
		// 	if (activeVideoElement != null) {
		// 		activeVideoElement.classList.add("wowza-screen");
		// 		shortNameElement.classList.add("wowza-shortname");
		// 		profileImageElement.classList.add("wowza-short-name-image");
		// 	}
		// }
		// if (this.state.isWowza === true) {
		// 	wowzaElement.style.display = "none";
		// 	if (activeVideoElement != null) {
		// 		activeVideoElement.classList.remove("wowza-screen");
		// 		shortNameElement.classList.remove("wowza-shortname");
		// 		profileImageElement.classList.remove("wowza-short-name-image");
		// 	}
		// }

		// StorageConfiguration.sessionSetItem('wowza', this.props.streamingData.streamingUrl);
		// StorageConfiguration.sessionSetItem('wowza', 'http://3.16.58.57:1935/Dallas_TX_191/dallas_clinic_stream_054/manifest.mpd?D0TxdbleDMXr2hRhash=fCXy3wVygG4s5tvumWCZOa09raz9KCVYtW3zuvovVaPfcNQMJVt17D1CK9NfPoZ9CfchnBkH86nWgy3ZgVNF7A==');

		localStorage.setItem('wowza', 'http://3.16.58.57:1935/Dallas_TX_191/dallas_clinic_stream_054/manifest.mpd?D0TxdbleDMXr2hRhash=fCXy3wVygG4s5tvumWCZOa09raz9KCVYtW3zuvovVaPfcNQMJVt17D1CK9NfPoZ9CfchnBkH86nWgy3ZgVNF7A==');
		window.open('/wowza', 'Data', 'height=600,width=1000');

	}

	openModal = () => {
		let role = Number(StorageConfiguration.sessionGetItem('role'));
		if (role === 2) {
			if (this.state.streamingUrl === '') {
				this.setState({ isDeviceChoosed: true });
				this.getDeviceList();
			}
			else {
				this.setState({ modalIsOpen: true });
			}
		}
		if (role !== 2) {
			let checkStreamingUrl = this.isEmpty(this.props.streamingData);
			if (checkStreamingUrl === false) {
				this.setState({ streamingUrl: this.props.streamingData.streamingUrl });
				this.setState({ modalIsOpen: true, showWowzaMainVideo: true });
				this.setState({ isWowza: false });

				localStorage.setItem('wowza', this.props.streamingData.streamingUrl);
			}
			else {
				Notify.sendNotification('Live streaming not enabled', AlertTypes.success);
			}
		}
	}

	closeModal() {
		this.setState({ modalIsOpen: false });
	}

	requestOrExitFullScreenByElement() {
		this.elFullScreenRef.fullScreen(this.elRef);

		if (!this.state.isWowza) {
			let activeVideoElement = document.getElementById(this.state.activeParticipantIdentity + '-active-video');
			activeVideoElement.classList.add("fullScreen");

			let activeShortNameElement = document.getElementById('active-short-name');
			activeShortNameElement.classList.add("fullScreen");
		}

		this.setState({ isFullScreen: true });
	}

	render() {
		// const videoURL = 'https://www.w3schools.com/html/mov_bbb.mp4';
		const audioTrack = this.state.audioTrack;
		const videoTrack = this.state.videoTrack;
		const isWowza = this.state.isWowza;
		const currentUserId = Number(StorageConfiguration.sessionGetItem('userId'));
		const receipients = this.props.receipientsList.filter(x => Number(x.userId) !== currentUserId);
		const receipientsDropDownList = [];
		for (const element of receipients) {
			receipientsDropDownList.push({
				label: element.userName,
				value: element.userId
			})
		}
		const { selectedAudio } = this.state;
		const { selectedVideo } = this.state;
		const { selectedOrganizer } = this.state;
		const { selectedDevice } = this.state;
		const { isFullScreen } = this.state;

		const currentUser = this.props.receipientsList.filter(x => Number(x.userId) === currentUserId);
		const currentUserRole = currentUser[0].role;
		const callerName = this.props.receipientsList.filter(x => Number(x.userId) !== currentUserId);

		return (

			<div>

				<Sidemenu />
				<div>
					<Sidebar
						sidebar={
							<div style={{ margin: '20px' }}>
								<div>
									<Typography variant="h6" style={{ float: 'left', marginTop: '10px' }}> Invite People </Typography>
									<IconButton style={{ float: 'right' }} onClick={() => this.onSetSidebarOpen(false)}>
										<CloseIcon />
									</IconButton>
								</div>

								<div>
									<Autocomplete
										id="tags-outlined"
										options={this.state.physiciansList}
										getOptionLabel={(option) => option.first_name + ' ' + option.last_name + ' - ' + (option.status ? option.status : 'offline')}
										filterSelectedOptions
										onChange={this.handleautocomplete}
										renderInput={(params) => (
											<TextField style={{ color: 'black !important' }}
												{...params}
												variant="outlined"
												label="Select"
												placeholder="People"
												onChange={e => this.onTodoChange(e.target.value)}
												onKeyUp={this.searchPhysiciansList}
											/>
										)}
									/>
								</div>

								<div>
									<Typography variant="subtitle1" style={{ marginTop: '10px', float: 'left' }}> Participants in this room </Typography>
								</div>

								<div>
									<table>
										<tbody>
											{
												this.props.receipientsList.map((data, i) => (
													<tr style={{ textTransform: 'capitalize' }} key={i}>
														<td> <img className="add-call-image-style" src={data.profilePic ? data.profilePic : avatar} alt="Perinatal access logo" /> </td>
														<td> <span>{data.userName}</span></td>
														{data.role === 'Host' ?
															<td>
																<span className="rounded-bar" style={{ marginLeft: '5px' }} >{data.role} </span>
															</td>
															:
															''
														}
														{
															data.status === 'attended' ? '' :
																<td> <span className="status-bar"> {data.status}</span> </td>
														}
														{
															data.status === 'No Response' || data.status === 'declined' ?
																<td>
																	<span title="Retry" className="ml-2 fas fa-redo" style={{ cursor: 'pointer', fontSize: '18px' }} onClick={() => { this.callRetry(data) }}> </span>
																</td>
																:
																''
														}
													</tr>
												))
											}
										</tbody>
									</table>
								</div>

							</div>
						}
						open={this.state.sidebarOpen}
						onSetOpen={this.onSetSidebarOpen}
						pullRight={true}
						styles={{
							sidebar: {
								zIndex: 2,
								position: 'fixed',
								top: '0px',
								bottom: '0px',
								transition: '-webkit-transform 0.3s ease-out 0s',
								overflowX: 'auto',
								background: '#FFF',
								transform: 'translateX(0%)',
								width: '390px',
								boxShadow: 'rgba(0, 0, 0, 0.15) 2px 2px 4px'
							}
						}}
					>
					</Sidebar>
				</div>

				<div className="layout-style">

					<div className="header-style" style={{ position: 'fixed', width: '86%' }}>

						<div style={{ display: 'flex', flexDirection: 'row' }}>
							{currentUserRole === 'Participant' ?
								<div className="video-name" style={{ textAlign: 'initial' }}>CALL WITH <span style={{ textTransform: 'uppercase' }}>{this.props.incomingCallInfo.callerName}</span></div>
								:
								currentUserRole === 'Host' && this.props.receipientsList.length === 1 ?
									<div className="video-name" style={{ textAlign: 'initial' }}>CALL WITH <span style={{ textTransform: 'uppercase' }}>{this.props.incomingCallInfo.callerName}</span></div>
									:
									<div className="video-name" style={{ textAlign: 'initial' }}>CALL WITH <span style={{ textTransform: 'uppercase' }}>{callerName[0].userName}</span></div>
							}
						</div>

						<div>
							{
								this.state.isOpenDraggable === true ?
									<div style={{ zIndex: '100', position: 'relative' }}>
										<Draggable axis="both" handle=".handle" defaultPosition={{ x: 0, y: 0 }} position={null} grid={[25, 25]} scale={1}>
											<div>
												<div className="handle" style={{ position: 'absolute', background: '#FFF', height: '-webkit-fill-available' }}>

													<div>
														{this.state.streamingUrl !== '' ?
															<ReactPlayer width='inherit' height='fit-content' url={this.state.streamingUrl} controls autoPlay />
															:
															''
														}

														<span onClick={this.closeDiv} style={{ position: 'absolute', right: '9px', color: '#FFF', cursor: 'pointer' }}><i className='fa fa-window-close' /></span>
													</div>


												</div>
											</div>
										</Draggable>

									</div>
									: ''
							}
						</div>


						<div>
							{
								this.state.modalIsOpen === true ?
									<ReactModal initWidth={800} initHeight={440}
										onFocus={() => console.log("Modal is clicked")}
										className={"my-modal-custom-class"}
										onRequestClose={this.closeModal}
										isOpen={this.state.modalIsOpen}>
										<div className="body">

											{this.state.streamingUrl !== '' ?
												<ReactPlayer width='inherit' height='fit-content' url={this.state.streamingUrl} controls autoPlay />
												:
												''
											}

										</div>
										<img onClick={this.closeModal} className="react-modal-close" src={closeicon} alt="Perinatal access logo" />
									</ReactModal>
									:
									''
							}
						</div>

						<div>
							<div style={{ textTransform: 'uppercase' }} className="container-fluid">
								<div className="row" ref="room" style={{ position: 'relative' }}>
									<div id="participants" ref="participants" className="col-xs-12 col-sm-12 col-md-12 col-lg-3 col-xl-3 participants_grid" ></div>

									<FullScreen ref={ref => { this.elFullScreenRef = ref }}>
										<div ref={ref => { this.elRef = ref }} id="active-participant" className="el-rq col-xs-12 col-sm-12 col-md-12 col-lg-8 col-xl-8" style={{ textAlign: "center", paddingTop: '25px', }}>
											<div className="participant main" ref="activeParticipant">
												<video ref="activeVideo" autoPlay playsInline muted></video>
											</div>
											<div className="active-wowza">
												<div id="active-wowza" style={{ display: 'none' }} className="wowza-video">
													<ReactPlayer width='inherit' height='fit-content' url={this.state.streamingUrl} controls autoPlay />
												</div>
											</div>

											{!isFullScreen ?

												<div className="video-button-main mb-5 mt-5" style={{ zIndex: '-1' }}>

													<IconButton onClick={this.audio} className="video-buttons">
														{audioTrack
															? <MicIcon className="video-icons" />
															: <MicOffIcon className="video-icons" />
														}
													</IconButton>

													<IconButton onClick={this.video} className="video-buttons">
														{videoTrack
															? <VideocamIcon className="video-icons" />
															: <VideocamOffIcon className="video-icons" />
														}
													</IconButton>

													<IconButton onClick={this.onSetSidebarOpen} className="video-buttons">
														<PersonAddIcon className="video-icons" />
													</IconButton>

													{/* <img onClick={this.handleDiv} className="add-stream-image-style" src={StreamIcon} alt="Perinatal access logo" /> */}

													<img onClick={this.openModal} className="add-stream-image-style" src={StreamIcon} alt="Perinatal access logo" />

													<IconButton onClick={this.requestOrExitFullScreenByElement.bind(this)} className="video-buttons">
														<FullscreenIcon className="video-icons" />
													</IconButton>

													<IconButton onClick={this.handleMeetingEnd} className="call-end">
														<CallEndIcon className="video-icons" />
													</IconButton>

												</div>
												:
												''
											}
										</div>
									</FullScreen>

									{this.state.showWowzaMainVideo === true ?
										<div>
											{isWowza === true ?
												<div onClick={this.toggleWowza} className="fas fa-eye wowza-show-hide-icon"></div>
												:
												isWowza === false ?
													<div onClick={this.toggleWowza} className="fas fa-eye-slash wowza-show-hide-icon"></div>
													:
													''
											}
										</div>
										:
										''
									}

								</div>
							</div>
						</div>

					</div>

				</div>
				<Footer />


				<div>
					{this.state.isDeviceChoosed ?
						<div className='logout-popup'>
							<div className='logoutPopupInner'>
								<div style={{ fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' }} className="modal-content">
									<div className="modal-header">
										<h4 className="modal-title">Choose Device</h4>
										<img onClick={this.closeDevicePopup} className="close-icon" src={closeicon} alt="Perinatal access logo" />
									</div>

									<div style={{ height: '120px' }} className="modal-body">
										{this.state.deviceList.length > 0 ?
											<div className="input-group p-3">

												<FormControl className="col-12">
													<label className="create-account-label">
														SELECT DEVICE<span className="asterisk">*</span>
													</label>
													<ReactSelect
														options={this.state.deviceList}
														value={selectedDevice}
														onChange={this.onStreamingUrlChange}
													/>
												</FormControl>

											</div>
											:
											<div style={{ textAlign: 'center' }}> No Devices Found
											</div>
										}
									</div>

									<div className="modal-footer">
										<button style={{ background: '#92B7BC' }} type="button" className="btn btn-secondary" data-dismiss="modal" onClick={this.closeDevicePopup}>Cancel</button>
										<button style={{ background: '#2c5566', marginLeft: '15px' }} type="button" className="btn btn-primary" onClick={this.getStreamUrl}>Apply</button>
									</div>

								</div>
							</div>
						</div>
						:
						''
					}
				</div>


				<div>
					{this.state.isRoomJoined ?
						<div className='popup'>
							<div className='callwaitingpopupinner'>

								<div className="modal-content">

									<div className="modal-header">
										<h4 className="modal-title">Waiting To Join...</h4>
									</div>
									{
										this.props.location.state.roomData.type === 'caller' ?
											<div>
												{this.props.recepientsInfo.recepientsInfo !== undefined ?
													<div>
														{
															this.props.recepientsInfo.recepientsInfo.map((data, i) => (
																Number(this.props.recepientsInfo.callerInfo.callerId) !== data.userId ?
																	<div key={i}>

																		<div className='call-image-view'>
																			<img className="call-image-style" src={data.profilePic ? data.profilePic : avatar} alt="Perinatal access logo" />
																		</div>

																		<div className='call-name-view'>
																			<span style={{ fontSize: '12px', color: '#2c5566', fontWeight: 'bold' }}>Call with </span>
																			<span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{data.userName}</span>
																			<Loader type="ThreeDots" color="#2c5566" height={50} width={50} timeout={80000} />
																		</div>

																	</div>
																	:
																	''
															))
														}
													</div>
													:
													<div style={{ padding: '30px' }} className='call-image-view'>
														No Participants
													</div>
												}
											</div>
											:
											this.props.location.state.roomData.type === 'receiver' ?
												<div >
													<div className='call-image-view'>
														<img className="call-image-style" src={this.props.incomingCallInfo.profilePic ? this.props.incomingCallInfo.profilePic : avatar} alt="Perinatal access logo" />
													</div>

													<div className='call-name-view'>
														<span style={{ fontSize: '12px', color: '#2c5566', fontWeight: 'bold' }}>Call with </span>
														<span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{this.props.incomingCallInfo.callerName}</span>
														<Loader type="ThreeDots" color="#2c5566" height={50} width={50} timeout={80000} />
													</div>
												</div>
												:
												''
									}
								</div>
							</div>
						</div>
						:
						''
					}
				</div>

				<div>
					{
						this.state.showMeetingEndPopup ?
							<div className='logout-popup'>
								<div className='logoutPopupInner'>
									<div style={{ fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' }} className="modal-content">
										<div className="modal-header call-history-modal-header">
											<h4 className="modal-title">Room</h4>
											<img onClick={this.handleMeetingClose} className="close-icon" src={closeicon} alt="Perinatal access logo" />
										</div>

										<div style={{ padding: '25px' }} className="modal-body">
											<span style={{ textAlign: 'center', display: 'block' }}>Are you sure you want to leave the room?</span>
										</div>

										<div className="modal-footer">
											<button style={{ background: '#92B7BC' }} type="button" className="btn btn-secondary" data-dismiss="modal" onClick={this.handleMeetingClose}>No</button>
											<button style={{ background: '#2c5566', marginLeft: '15px' }} type="button" className="btn btn-primary" onClick={this.leaveRoom}>Yes</button>
										</div>

									</div>
								</div>
							</div>
							:
							''
					}
				</div>


				<div>
					{
						this.state.showOrganizerChange ?
							<div className='logout-popup'>
								<div className='logoutPopupInner'>
									<div style={{ fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' }} className="modal-content">
										<div className="modal-header call-history-modal-header">
											<h4 className="modal-title">Select Organizer</h4>
											<img onClick={this.handleOrganizerClose} className="close-icon" src={closeicon} alt="Perinatal access logo" />
										</div>

										<div style={{ paddingBottom: '0px' }} className="modal-body">
											<span style={{ textAlign: 'center', display: 'block' }}>Are you sure you want to leave the room?</span>
										</div>

										<div className="modal-body" style={{ paddingBottom: '20px' }}>
											<div className="input-group p-3">
												<FormControl className="col-12">
													<label className="create-account-label">
														SELECT ORGANIZER<span className="asterisk">*</span>
													</label>
													<ReactSelect
														options={receipientsDropDownList}
														value={selectedOrganizer}
														onChange={this.onOrganizerChange}
													/>
												</FormControl>
											</div>
										</div>

										<div className="modal-footer">
											<button style={{ background: '#92B7BC' }} type="button" className="btn btn-primary" onClick={this.handleOrganizerClose}>Cancel</button>
											<button style={{ background: '#2c5566', marginLeft: '15px' }} type="button" className="btn btn-primary" onClick={this.changeHost}>Change Host</button>
										</div>

									</div>
								</div>
							</div>
							:
							''
					}
				</div>


				<div>
					{
						this.state.showInputDevicePopup ?
							<div className='logout-popup'>
								<div className='logoutPopupInner'>
									<div style={{ fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' }} className="modal-content">
										<div className="modal-header">
											<h4 className="modal-title">Select Audio/Video</h4>
										</div>

										<div className="modal-body" style={{ paddingBottom: '40px' }}>

											<div className="input-group p-3">
												<FormControl className="col-12">
													<label className="create-account-label">
														SELECT AUDIO DEVICE<span className="asterisk">*</span>
													</label>
													<ReactSelect
														options={this.state.audioDevices}
														value={selectedAudio}
														onChange={this.onAudioChange}
													/>
												</FormControl>
											</div>

											<div className="input-group p-3">
												<FormControl className="col-12">
													<label className="create-account-label">
														SELECT VIDEO DEVICE<span className="asterisk">*</span>
													</label>
													<ReactSelect
														options={this.state.videoDevices}
														value={selectedVideo}
														onChange={this.onVideoChange}
													/>
												</FormControl>
											</div>

										</div>

										<div className="modal-footer">
											<button style={{ background: '#2c5566', marginLeft: '10px' }} onClick={this.connectRoom} type="button" className="btn btn-primary">Apply</button>
										</div>

									</div>
								</div>
							</div>
							:
							''
					}
				</div>

				<div>
					{
						this.state.showConnectParticipantPopup ?
							<div className='logout-popup'>
								<div className='logoutPopupInner'>
									<div style={{ fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' }} className="modal-content">
										<div className="modal-header call-history-modal-header">
											<h4 className="modal-title">Room</h4>
											<img onClick={this.closeConnectParticipantPopup} className="close-icon" src={closeicon} alt="Perinatal access logo" />
										</div>

										<div style={{ padding: '25px' }} className="modal-body">
											<span style={{ textAlign: 'center', display: 'block' }}>Are you sure you want to call?</span>
										</div>

										<div className="modal-footer">
											<button style={{ background: '#92B7BC' }} type="button" className="btn btn-secondary" data-dismiss="modal" onClick={this.closeConnectParticipantPopup}>No</button>
											<button style={{ background: '#2c5566', marginLeft: '15px' }} type="button" className="btn btn-primary" onClick={this.connectParticipant}>Yes</button>
										</div>

									</div>
								</div>
							</div>
							:
							''
					}
				</div>

			</div >

		);
	}
}


const mapDispachToProps = dispatch => {
	return {
		sendMessage: (data) => dispatch({ type: "SIGNALR_OUTGOING_CALLS", value: data }),
		saveRecipients: (currentRecipients) => dispatch({ type: "SAVE_RECIPIENTS", value: currentRecipients }),
		removeRecipients: (data) => dispatch({ type: "REMOVE_PARTICIPANTS", value: data }),
		sendStreamingUrl: (data) => dispatch({ type: "SIGNALR_NOTIFY_STREAMING_URL", value: data }),
		reAssignOrganizer: (data) => dispatch({ type: "RE_ASSIGN_ORGANIZER", value: data }),
		sendUserStatus: (data) => dispatch({ type: "USER_STATUS", value: data })
	};
};

const mapStateToProps = state => {
	return {
		clinicId: state.clinicId,
		roomDetails: state.roomDetails,
		participants: state.participants,
		incomingCallInfo: state.incomingCallInfo,
		recepientsInfo: state.recepientsInfo,
		receipientsList: state.receipientsList,
		streamingData: state.streamingData
	};
};

export default withRouter(connect(
	mapStateToProps,
	mapDispachToProps
)(VideoComponent));

