import axios from 'axios';

async function testFetch() {
    const url = "https://dealora-7st9.onrender.com/uploads/card_design/1787830365864_388433612.webp";
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    console.log('Response status:', res.status);
    console.log('res.data type:', typeof res.data, res.data.constructor.name);
    
    // Proper way for ArrayBuffer:
    const buf = Buffer.from(res.data);
    console.log('Buffer length:', buf.length);
    const base64 = `data:${res.headers['content-type'] || 'image/webp'};base64,${buf.toString('base64')}`;
    console.log('Base64 length:', base64.length);
}

testFetch().catch(console.error);
