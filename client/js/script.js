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

  $('#messages-window').scrollTop($('#messages-window').height());
});
