import fs from 'fs';
import { generateCardPngBuffer } from './api/utils/cardSvgGenerator.js';
import { fetchCardData } from './api/utils/fetchCardData.js';

async function testCard35() {
    console.log('Fetching card 35 from backend...');
    const card = await fetchCardData({ id: 35, type: 1, cus_id: 1 });
    console.log('Card 35 data:', {
        brandName: card.brandName,
        title: card.title,
        bgImage: card.bgImage,
        bgColor: card.bgColor,
        textColor: card.textColor,
        borderColor: card.borderColor,
        stamp_radius: card.stamp_radius,
        stampBgColor: card.stampBgColor,
        stampBorderColor: card.stampBorderColor
    });

    console.log('Generating PNG with background image...');
    const buf = await generateCardPngBuffer(card);
    fs.writeFileSync('test_card35_bg.png', buf);
    console.log('Successfully saved test_card35_bg.png, byte size:', buf.length);
}
  
testCard35().catch(console.error);
