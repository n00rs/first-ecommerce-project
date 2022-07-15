const { response } = require("express");

function changeQuantity(cartId,prodId,userId,count) {
    let quantity = parseInt(document.getElementById(prodId).innerHTML);
     
    $.ajax({
        url: "change-quantity",
        data:{
            cart:cartId,
            product:prodId,
            user: userId,
            count:count,
            quantity:quantity

        },
        method: 'post',
        success:(response)=>{
            if(response.productRemoved){
                alert('item removed from the card')
                location.reload()
            }else{
                document.getElementById(prodId).innerHTML=quantity+count;
                document.getElementById('total').innerHTML=response.total;
                
            }
        }
    })
}


function removeCartItem(cartId,prodId) {
    
    $.ajax({
        url:"remove-cart-item",
        data:{
            cart:cartId,
            product:prodId
        },
        method:'post',
        success:(response)=>{
            if(response.itemRemoved)
            alert("item removed")
        }
    })
}


function addToCart(prodId){
    $.ajax({
        url: "add-to-cart/"+prodId,
        method: 'get',
        success: (response)=>{
            
            if(response.status){
                let count = $("#cartCount").html();
                count= parseInt(count)+1;
                $("#cartCount").html(count);
            }
        }    })
}

function shipped(orderId) {
    $.ajax({
        url:"item-shipped/",
        data:{
            id:orderId
        },
        method:'post',
        success:(response)=>{
            if(response.status){
                document.getElementById('shipmentStatus').innerHTML = 'shipped'
            }
        }
    })
}