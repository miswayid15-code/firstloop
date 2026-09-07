import { fetchCardData } from './api/utils/fetchCardData.js';

async function checkCard() {
    const data = await fetchCardData({ id: 35, type: 1, cus_id: 1 });
    console.log('API returned card details:', JSON.stringify(data, null, 2));
}

checkCard();
