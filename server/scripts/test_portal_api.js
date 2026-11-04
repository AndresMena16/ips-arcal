import fetch from 'node:http';

async function testApi() {
  const res = await fetch('http://localhost:3001/api/datos-curiosos');
  console.log('Status:', res.status);
}

