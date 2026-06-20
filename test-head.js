import fetch from 'node-fetch';

async function testHead() {
  try {
    const url = 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Mexican_tortilla.jpg';
    const res = await fetch(url, { method: 'HEAD' });
    console.log('HEAD OK:', res.ok);
  } catch (e) {
    console.log('HEAD error:', e.message);
  }
}

testHead();
