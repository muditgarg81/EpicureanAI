import fetch from 'node-fetch';

const testMemoni = async () => {
    const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent("Memoni Biryani")}&utf8=&format=json&origin=*`);
    const data = await res.json();
    console.log(data.query.search);
}

testMemoni();
