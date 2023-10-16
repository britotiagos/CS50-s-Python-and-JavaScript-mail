document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);
  document
    .querySelector("#compose-form")
    .addEventListener("submit", send_email);

  // By default, load the inbox
  load_mailbox("inbox");
});

function send_email(event) {
  event.preventDefault();
  const recipients = document.querySelector("#compose-recipients").value;
  const subject = document.querySelector("#compose-subject").value;
  const body = document.querySelector("#compose-body").value;

  fetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body,
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      load_mailbox("inbox");
    });
}

function compose_email() {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";

  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  // Get emails from mailbox
  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      emails.forEach((email) => {
        const element = document.createElement("div");
        element.className = "card";
        element.innerHTML = `
          <div class="card-body">
            <div class="row">
              <div class="col-3">
                <strong>${email.sender}</strong>
              </div>
              <div class="col-6">
                ${email.subject}
              </div>
              <div class="col-3">
                ${email.timestamp}
              </div>
            </div>
          </div>
        `;

        element.addEventListener("click", () => {
          show_email(email.id);
        });
        if (email.read) {
          element.style.backgroundColor = "#e9ecef";
        }
        document.querySelector("#emails-view").append(element);
      });
    });

  // archive email
  function archive_email(id, archived) {
    fetch(`/emails/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        archived: !archived,
      }),
    }).then(() => load_mailbox("inbox"));
  }

  // reply email
  function reply_email(sender, subject, body, timestamp) {
    compose_email();

    document.querySelector("#compose-recipients").value = sender;
    if (subject.slice(0, 3) !== "Re:") {
      subject = `Re: ${subject}`;
    }
    document.querySelector("#compose-subject").value = subject;
    document.querySelector(
      "#compose-body"
    ).value = `On ${timestamp} ${sender} wrote: ${body}`;
  }

  // view email
  function show_email(id) {
    fetch(`/emails/${id}`)
      .then((response) => response.json())
      .then((email) => {
        document.querySelector("#emails-view").innerHTML = `
          <div class="card">
            <div class="card-body">
              <div class="row">
                <div class="col-3">
                  <strong>From:</strong>
                </div>
                <div class="col-9">
                  ${email.sender}
                </div>
              </div>
              <div class="row">
                <div class="col-3">
                  <strong>To:</strong>
                </div>
                <div class="col-9">
                  ${email.recipients}
                </div>
              </div>
              <div class="row">
                <div class="col-3">
                  <strong>Subject:</strong>
                </div>
                <div class="col-9">
                  ${email.subject}
                </div>
              </div>
              <div class="row">
                <div class="col-3">
                  <strong>Timestamp:</strong>
                </div>
                <div class="col-9">
                  ${email.timestamp}
                </div>
              </div>
              <div class="row">
                <div class="col-12">
                  <hr>
                  ${email.body}
                </div>
              </div>
            </div>
          </div>
        `;

        // archive button
        const archive_button = document.createElement("button");
        archive_button.className = "btn btn-sm btn-outline-primary";
        archive_button.innerHTML = email.archived ? "Unarchive" : "Archive";
        archive_button.addEventListener("click", () => {
          archive_email(id, email.archived);
        });

        // reply button
        const reply_button = document.createElement("button");
        reply_button.className = "btn btn-sm btn-outline-primary";
        reply_button.innerHTML = "Reply";
        reply_button.addEventListener("click", () => {
          reply_email(email.sender, email.subject, email.body, email.timestamp);
        });

        // add buttons to email
        document.querySelector(".card-body").append(archive_button);
        document.querySelector(".card-body").append(reply_button);

        // mark email as read
        fetch(`/emails/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            read: true,
          }),
        });
      });
  }
}
