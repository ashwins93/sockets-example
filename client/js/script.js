$(function() {
  $("#messageBox").keypress(function(e) {
    if (e.which === 13) {
      sendMessage($(this).val(), $("#name").val());
      $(this).val("");
    }
  });

  $("#secret").keypress(function(e) {
    if (e.which === 13) {
      logIn($(this).val());
      connectSocket();
      getMessages(function(data) {
        $("#messages").append(`<li>${data.name}: ${data.message}</li>`);
      });
    }
  });
});
let socket = undefined;

function sendMessage(message, name) {
  if (socket) {
    socket.emit("message", {
      message,
      name
    });
  }
}

function getMessages(cb) {
  if (socket) {
    socket.on("message", cb);
  }
}

function connectSocket() {
  socket = io({
    query: {
      token: localStorage.getItem("token")
    }
  });
}

function logIn(secret) {
  $.post({
    url: "/login",
    data: {
      secret
    }
  }).then(response => {
    // console.log(response);
    localStorage.setItem("token", response.token);
  });
}
