$(function() {
  $.getJSON({
    url: '/api/profileinfo',
    headers: {
      Authorization: 'Bearer ' + sessionStorage.getItem('token')
    }
  })
    .then(response => {
      $('#root').html(`<p>${response.username}</p>`);
    })
    .catch(console.log);

  let socket = io('/');
  // console.log(socket);
  socket.on('connect', function() {
    socket
      .on('authenticated', function() {
        // console.log('Authenticated');
      })
      .emit('authenticate', { token: sessionStorage.getItem('token') });
  });

  scrollMsgToBottom();

  $('#new-message').keypress(function(e) {
    if (e.which === 13) {
      $('<li>')
        .appendTo($('#messages'))
        .text($(this).val())
        .addClass('list-group-item');
      $(this).val('');
      scrollMsgToBottom();
    }
  });
});

function scrollMsgToBottom() {
  $('#messages-window').scrollTop($('#messages-window').height());
}
