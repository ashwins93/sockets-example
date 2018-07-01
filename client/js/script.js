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
});
