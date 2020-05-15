// var url = "https://kmadhumidha56.freshdesk.com/api/v2/tickets?per_page=10&page=1"; 
var key = "L7PXgLaTSS4hNqUgkYQO"

console.log(btoa("L7PXgLaTSS4hNqUgkYQO:X"));
// fetch(url, {
//     method: 'GET',
//     headers:{
//         'Authorization':  'Basic ' + btoa(key + ':' + 'X'),
//         'Content-Type' : 'application/json'
//     }
// }).then(res => res.json()).then(res => console.log(res)).catch(err => console.log(err))

// url = "https://kmadhumidha56.freshdesk.com/api/v2/contacts"; 

// fetch(url, {
//     method: 'GET',
//     headers:{
//         'Authorization':  'Basic ' + btoa(key + ':' + 'X'),
//         'Content-Type' : 'application/json'
//     }
// }).then(res => res.json()).then(res => console.log(res)).catch(err => console.log(err))

var url = `https://kmadhumidha56.freshdesk.com/api/v2/tickets?per_page=10&page=1`; 

fetch(url, {
    method: 'GET',
    headers:{
        'Authorization':  'Basic ' + btoa(key + ':' + 'X'),
        'Content-Type' : 'application/json'
    }
}).then(res => {
    console.log(res);
   res.json();
}).then(resp => {
        console.log(resp);
}).catch(err => console.log(err))