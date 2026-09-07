import fs from 'fs';
import { generateCardPngBuffer } from './api/utils/cardSvgGenerator.js';
import { fetchCardData } from './api/utils/fetchCardData.js';

async function testCard35() {
    console.log('Fetching card 35...');
    const card = await fetchCardData({ id: 35, type: 1, cus_id: 1 });
    console.log('bgImage:', card.bgImage);
    console.log('bgColor:', card.bgColor);
    console.log('Generating PNG...');
    const buf = await generateCardPngBuffer(card);
    fs.writeFileSync('test_card_bg.png', buf);
    console.log('Saved test_card_bg.png, size:', buf.length);
}

testCard35().catch(console.error);
