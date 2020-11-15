import * as crypto from 'crypto-js';


export var token = 'token';
export var userName = 'userName';
export var role = 'role';
export var email = 'email';
export var password = 'password';
export var isloggedIn = 'isloggedIn';

const StorageConfiguration = {

    sessionSetItem(key, value) {
        localStorage.setItem(this.encrypt(key), this.encrypt(value));
    },

    sessionGetItem(key) {
        let decryptedValue = localStorage.getItem(this.encrypt(key));
        return decryptedValue != null ? this.decrypt(decryptedValue) : null;
    },

    sessionRemoveItem(key) {
        localStorage.removeItem(this.encrypt(key));
    },

    encrypt(inputEncrypt) {
        let key = crypto.enc.Utf8.parse('7061737323313244');
        let iv = crypto.enc.Utf8.parse('7061737323313244');
        let encrypted = crypto.AES.encrypt(crypto.enc.Utf8.parse(inputEncrypt), key,
            {
                keySize: 128 / 8,
                iv: iv,
                mode: crypto.mode.CBC,
                padding: crypto.pad.Pkcs7
            });
        return encrypted.toString();
    },

    decrypt(inputDecrypt) {
        let key = crypto.enc.Utf8.parse('7061737323313244');
        let iv = crypto.enc.Utf8.parse('7061737323313244');

        let decrypted = crypto.AES.decrypt(inputDecrypt, key, {
            keySize: 128 / 8,
            iv: iv,
            mode: crypto.mode.CBC,
            padding: crypto.pad.Pkcs7
        });
        return decrypted.toString(crypto.enc.Utf8);
    }

}

export default StorageConfiguration;