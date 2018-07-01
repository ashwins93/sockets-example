$(function() {
  $.getJSON({
    url: '/api/profileinfo',
    headers: {
      Authorization: 'Bearer ' + sessionStorage.getItem('token')
    }
  })
    .then(response => {
      $('#name').text(`${response.username}`);
    })
    .catch(console.log);

  let socket = io('/');
  // console.log(socket);
  socket.on('connect', function() {
    socket
      .on('authenticated', function() {
        // console.log('Authenticated');
        $('#new-message').keypress(function(e) {
          if (e.which === 13) {
            socket.emit('message', $(this).val());
            $(this).val('');
          }
        });
        socket.on('message', ({ name, message }) => {
          addMessageToWindow(`${name}: ${message}`);
        });
      })
      .emit('authenticate', { token: sessionStorage.getItem('token') });
  });

  $('#logout').click(() => {
    sessionStorage.setItem('token', '');
  });

  scrollMsgToBottom();
});

function scrollMsgToBottom() {
  $('#messages-window').scrollTop($('#messages-window').height());
}

function addMessageToWindow(message) {
  $('<li>')
    .appendTo($('#messages'))
    .text(message)
    .addClass('list-group-item');
  scrollMsgToBottom();
}
