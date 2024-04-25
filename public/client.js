/*global io*/
let socket = io();
socket.on('user',(data)=>{
  console.log(data);
  $('#num-users').text(data.currentUsers+' users online');
  const msg = `${data.username} has ${data.connected?'joined':'left'} the chat.`;
  $('#messages').append($('<li>').html('<b>'+msg+'</b>'))
})
socket.on("chat message",(data)=>{
  $("#messages").append($("<li>").html(data.username+": "+data.message))
})
$(document).ready(function () {
  // Form submittion with new message in field with id 'm'
  $("form").submit(function () {
    var messageToSend = $("#m").val();
    socket.emit('chat message',messageToSend);
    $("#m").val("");
    return false; // prevent form submit from refreshing page
  });
});
