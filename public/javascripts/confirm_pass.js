function password_confirm(){
let  pass = document.getElementById('password').value;
let confrm = document.getElementById('confirmpass').value
if(pass != confrm){
    document.getElementById('message').style.color = 'red';
    document.getElementById('message').innerHTML = 'use same password';
    document.getElementById('signup').disabled = true ;
}else{
    document.getElementById('message').style.color = 'green';
    document.getElementById('message').innerHTML = 'Password Confirmed';
    document.getElementById('signup').disabled = false
}
}