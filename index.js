// const result = await fetch('https://test-project-production-88cc.up.railway.app/api/create-trx', {
//     method : 'POST',
//     headers : { 'Content-Type': 'application/json', 'apikey' : '13acc245-b584-4767-b80a-5c9a1fe9d71e' },
//     body : JSON.stringify({
//         accountid : 5, amount : 100
//     })
    
// })
// console.log(await result.json());
const result = await fetch(' https://test-project-production-88cc.up.railway.app/api/get-trx-details/5f835776550cc661cd4f338b5500a206', {
    method : 'GET',
    headers : {'Content-Type': 'application/json', 'apikey' : '13acc245-b584-4767-b80a-5c9a1fe9d71e'}
})
console.log(await result.json());