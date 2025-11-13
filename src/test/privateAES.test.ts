import { encryptPrivateKey, decryptPrivateKey } from "../PrivateAES.js";

describe.only("privateAES", () => {
    
    test("test", async () => {
        const privateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
        const password = '12345678';
        const encrypted =await encryptPrivateKey(privateKey, password);
        console.log(encrypted);
        const decrypted =await decryptPrivateKey(encrypted, password);
        console.log(decrypted);
        expect(decrypted).toBe(privateKey);
    })
})