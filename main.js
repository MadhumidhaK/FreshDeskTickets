const ticketsNav = $('[name="tickets"]');
const contactsNav = $('[name="contacts"]');
const main = $(`.main`);


let domain = 'kmadhumidha56';
let key = 'L7PXgLaTSS4hNqUgkYQO';
const perPage = 20;

const statusCodes = {
    2 : "New",
    3 : "Pending",
    4 : "Resolved",
    5 : "Closed",
    6 : "Waiting on Customer",
    7 : "Waiting on Third Party"
}

const priorityCodes = {
    1 : "Low",
    2 : "Medium",
    3 : "High",
    4 : "Urgent"
}

const sourceCodes = {
    1 : "Email",
    2 : "Portal",
	3 : "Phone",
	4 : "Forum",
	5 : "Twitter",
	6 : "Facebook",
	7 : "Chat",
	8 : "Mobihelp",
	9 : "Feedback_widget",
	10: "Outbound_email",
	11: "Ecommerce"
}

const types = ["Question", "Incident", "Problem", "Feature Request", "Refund"]

const topRow = $(`.top`);


$(document).ready(function(){
    const clickHereText = $(`<p class='click-here'>Click  <span class='span-link'>here</span> to change the domain and API Key</p>`);
    main.html(clickHereText);

    const clickHereLink = $(`.span-link`);
    clickHereLink.on('click', function(){
        const loginDiv = $(`<div class='login-div'></div>`);
        const domainField = $(`<input type='text' id="domain" placeholder='domain.freshdesk.com'>`);
        const apiKeyField = $(`<input type='text' id='api-key' placeholder='Enter your API Key'>`);
        const submitBtn = $(`<button id='login'>Submit</button>`);
        
        loginDiv.append(domainField);
        loginDiv.append(apiKeyField);
        loginDiv.append($(`<div class='center'></div>`).append(submitBtn));
        main.html(loginDiv);

        submitBtn.on('click', async function(){
            const enteredDomain = domainField.val().trim().slice(0, -14);
            const enteredApiKey = apiKeyField.val().trim();

            try{
                const url =`https://${enteredDomain}.freshdesk.com/api/v2/tickets?per_page=10&page=1`; ;
                const response = await fetch(url, {
                    method: 'GET',
                    headers:{
                        'Authorization':  'Basic ' + btoa(enteredApiKey + ':' + 'X'),
                        'Content-Type' : 'application/json'
                    }
                });

                if(response.status == 200){
                    domain = enteredDomain;
                    key = enteredApiKey;
                    const notify = $(`#notify-message`)
                    notify.text('Connected to helpdesk');
                    notify.fadeIn('slow').delay(3000).fadeOut('slow');
                    displayTicketsInit();
                }else{
                    alert('Unable to connect to your helpdesk. Entered details are invalid');
                }
            }catch(err){
                console.log(err);
                console.log('Error while changeing the domain');
            }
        })

    })
})

ticketsNav.on('click', function(){
    topRow.html("");
    const createTicket = $(`<a href="#" class="create-btn">New Ticket</a>`);
   
    topRow.append(createTicket);    
    displayTicketsInit();
    createTicket.on('click', async function(){
        main.html("");
        main.removeClass('main-bg');
        const ticketForm = await getTicketForm();
        main.html(ticketForm);
        $(`.ticket`).remove();
    })
});

async function contactFieldHandle(contactField){
    console.log(contactField);
    contactField.attr('list', 'contacts-list');

    const contactList = $(`<datalist id="contacts-list"></datalist>`);
    contactList.insertAfter(contactField);

    const contacts = await getContacts();

    await contacts.forEach(contact => {
        const option = $(`<option value='${contact.name} <${contact.email}>'>`);
        contactList.append(option);
    }); 

    const agents = await getAgents();
    await agents.splice(0,1);
    await agents.forEach(agent => {
        const option = $(`<option value='${agent.contact.name} <${agent.contact.email}>'>`);
        contactList.append(option);
    }); 

    contactField.append(contactList);

    contactField.focusout(() =>{
        contactList.remove();
    });
}

async function agentFieldHandle(agentField, selectedGroup, editFlag = false, ticket= {}){
    // console.log("called agentHandle");
    // console.log(ticket);
    // console.log(selectedGroup);
    const agents = await getAgents();
    await agents.splice(0,1);
    
    if(selectedGroup == ""){
        await agents.forEach(agent => {
            const option = $(`<option value='${agent.id}'>${agent.contact.name} <${agent.contact.email}></option>`);
            agentField.append(option);
            if(editFlag){
                if(agent.id == ticket.responder_id){
                    option.prop('selected', true)
                }
            }
            // console.log(agent.contact.name);
        });
    }else{
        await agents.forEach(async agent => {
            const agentObj = await getAgent(agent.id);
            // console.log(agentObj.group_ids.includes(parseInt(selectedGroup)));
            if(agentObj.group_ids.includes(parseInt(selectedGroup))){
                const option = $(`<option value='${agent.id}'>${agent.contact.name} <${agent.contact.email}></option>`);
                agentField.append(option);
                if(editFlag){
                    if(agent.id == ticket.responder_id){
                        option.prop('selected', true)
                    }
                }
            }
        });
    }

    
    
}

async function getTicketForm(editFlag = false, ticket = {}){
    const form = $(`<form class="ticket-form" autocomplete="off"></form>`);

    const contactFieldLabel = $(`<label for="contact">Contact</label>`);
    form.append(contactFieldLabel);
    const contactField = $(`<input class="form-field"  id="email" placeholder="Type to Search contact" required></input>`);
    form.append(contactField);

    contactField.keyup(()=>{
        contactFieldHandle(contactField);
    });

    const subjecttFieldLabel = $(`<label for="subject">Subject</label>`);
    form.append(subjecttFieldLabel);
    const subjectField = $(`<input class="form-field" id="subject" placeholder="Enter Subject" required></input>`);
    form.append(subjectField);

    const typeSelectLabel = $(`<label for="type">Type</label>`);
    form.append(typeSelectLabel);
    const typeSelect = await getTypeSelect();
    form.append(typeSelect); 

    const statusSelectLabel = $(`<label for="status">Status</label>`);
    form.append(statusSelectLabel);
    const statusSelect = await getStatusSelect();
    form.append(statusSelect); 

    const prioritySelectLabel = $(`<label for="priority">Priority</label>`);
    form.append(prioritySelectLabel);
    const prioritySelect = await getPrioritySelect();
    form.append(prioritySelect);

    const groupSelectLabel = $(`<label for="group">Group</label>`);
    form.append(groupSelectLabel);
    const groupSelect = await getGroupSelect();
    form.append(groupSelect);

    const agentFieldLabel = $(`<label for="agent">Agent</label>`);
    form.append(agentFieldLabel);
    const agentField = $(`<select class="form-field" id="agent"><option value=""></option></input>`);
    form.append(agentField);

    agentField.ready(() => {
        // console.log(ticket);
        let selectedGroup = "";
        if(editFlag){
            // console.log('edit');
            if(ticket.group_id){
                // console.log('true for groupid');
                selectedGroup = ticket.group_id;
            }
        }
        agentFieldHandle(agentField, selectedGroup, editFlag, ticket);
    })

    groupSelect.on('input', function(){
        const selectedGroup = groupSelect.find(":selected").val();
        agentField.html(`<option value=""></option>`);
        agentFieldHandle(agentField, selectedGroup);
    })

    const descLabel = $(`<label for="description">Description</label>`);
    const descriptionTextArea = $(`<textarea class="form-field" id="description" required></textarea>`);
    form.append(descLabel);
    form.append(descriptionTextArea);

    const tagDiv = $(`<div class='tag-div'></div>`);
    const tagsFieldLabel = $(`<label for="tags">Tags</label>`);
    tagDiv.append(tagsFieldLabel);
    const tagsField = $(`<input class="form-field" id="tags"><span>Leave a space between tags</span></input>`);
    

    tagDiv.append(tagsField);
    form.append(tagDiv);
    //https://stackoverflow.com/questions/10839570/how-does-stackoverflow-make-its-tag-input-field

    const cancel = $(`<button class='btn' id="cancel">Cancel</button>`);
    form.append(cancel);
    cancel.on('click', function(){
        displayTicketsInit();
    });
    const submit = $(`<button class='btn' id="submit">${editFlag ? "Update" : "Create"}</button>`);
    form.append(submit);

    if(editFlag){
        const contact = await getContact(ticket.requester_id);
        // console.log(contact);
        if(contact){
            // console.log('Contact');
            contactField.val(`${contact.name} <${contact.email}>`);
        }else{
            const requesterAgent = await getAgent(ticket.requester_id);
            // console.log('requesterAgent')
            // console.log(requesterAgent)
            contactField.val(`${requesterAgent.contact.name} <${requesterAgent.contact.email}>`)
        }

        if(ticket.subject){
            subjectField.val(ticket.subject);
        }

        if(ticket.type){
                const typeOption =  typeSelect.children(`option[value='${ticket.type}']`);
                typeOption.prop('selected', true);
        }
        

        const statusOption = statusSelect.children(`option[value='${ticket.status}']`);
        statusOption.prop('selected', true);

        const priorityOption = prioritySelect.children(`option[value='${ticket.priority}']`);
        priorityOption.prop('selected', true);

        if(ticket.group_id){
            const groupOption = groupSelect.children(`option[value='${ticket.group_id}']`);
            groupOption.prop('selected', true);

            
        }
        
       

        if(ticket.description_text){
            descriptionTextArea.val(ticket.description_text);
        }
        // if(ticket.responder_id){
        //     const agentOption = agentField.children(`option[value='${ticket.responder_id}']`);
        //     console.log("responder_id " + ticket.responder_id );
        //     agentOption.prop('selected', true);
        // }

        if(ticket.tags.length > 0){
            tagsField.val(ticket.tags.join(" "))
        }
    }

    submit.on('click', function(e){
        e.preventDefault();
        formOnSubmit(form, editFlag, ticket);
    })

    return form;
}

async function formOnSubmit(form, editFlag, existingTicket){
    const ticket = {};
    const contactValue = $(`#email`).val();
    const contactValArr = contactValue.split('<');
    
    if( contactValArr.length > 1){
        const contactName = contactValArr[0].trim();
        const contactEmail = contactValArr[1].trim().slice(0,-1);
        ticket.email = contactEmail;
    }else{
        const contactEmail = contactValArr[0].trim();
        ticket.email = contactEmail;
    }
    
    const subject = $(`#subject`).val().trim();
    ticket.subject = subject;

    const type = $(`#type`).find(':selected').val();
    if(!type == ""){
        ticket.type = type;
    }
    

    const status = $(`#status`).find(':selected').val();
    ticket.status = parseInt(status);

    const priority = $(`#priority`).find(':selected').val();
    ticket.priority = parseInt(priority);

    const group = $(`#group`).find(':selected').val();
    if(group){
        ticket.group_id = parseInt(group);
    }

    const agent = $(`#agent`).find(':selected').val();
    if(agent){
        console.log(agent);

        ticket.responder_id = parseInt(agent);
    }

    const description = $(`#description`).val();
    ticket.description = description;

    const tags = $('#tags').val().trim().split(" ");
    ticket.tags = tags;

    if(!editFlag){
        try{
            console.log(ticket);
            const createdTicketResponse = await createTicket(ticket);
            
            console.log(createdTicketResponse);
            if(createdTicketResponse.errors){
                createdTicketResponse.errors.forEach(error => {
                    let errField = $(`#${error.field}`)
                    if(error.field == 'responder_id'){
                        errField = $(`#agent`);
                    }    

                    errField.addClass('error');
                    errField.siblings(`.${error.field}-err`).remove();
                    const errorMessage = $(`<p class='form-field err-message ${error.field}-err'>${createdTicketResponse.errors[0].message}</p>`);
                    errorMessage.insertAfter(errField);
                    errField.change(function(){
                        errField.removeClass('error');
                        errField.siblings(`.${error.field}-err`).remove();
                    })
                })
            }else{
                displayTicketsInit();
                const notify = $(`#notify-message`)
                notify.text('Ticket Created');
                notify.fadeIn('slow').delay(3000).fadeOut('slow');
            }
        }catch(err){
            console.log(err);
        }
    }else{
        try{
            const updatedTicketResponse = await updateTicket(existingTicket, ticket);
            console.log(updatedTicketResponse);

            if(updatedTicketResponse.errors){
                updatedTicketResponse.errors.forEach(error => {
                    let errField = $(`#${error.field}`)
                    if(error.field == 'responder_id'){
                        errField = $(`#agent`);
                    }    

                    errField.addClass('error');
                    errField.siblings(`.${error.field}-err`).remove();
                    const errorMessage = $(`<p class='form-field err-message ${error.field}-err'>${updatedTicketResponse.errors[0].message}</p>`);
                    errorMessage.insertAfter(errField);
                    errField.change(function(){
                        errField.removeClass('error');
                        errField.siblings(`.${error.field}-err`).remove();
                    })
                })
            }else{
                displayTicketsInit();
                const notify = $(`#notify-message`)
                notify.text('Ticket Updated');
                notify.fadeIn('slow').delay(3000).fadeOut('slow');
            }
        }catch(err){

        }
    }
        
}

async function getPrioritySelect(){
    const prioritySelect = $(`<select class="form-field" id="priority" required></select>`);
    Object.keys(priorityCodes).forEach(async priorityCode => {
        const option = $(`<option value="${priorityCode}">${priorityCodes[priorityCode]}</option>`);
        prioritySelect.append(option);
    });

    return prioritySelect;
}

async function getStatusSelect(){
    const statusSelect = $(`<select class="form-field" id="status" required></select>`);
    Object.keys(statusCodes).forEach(async statusCode => {
        const option = $(`<option value="${statusCode}">${statusCodes[statusCode]}</option>`);
        statusSelect.append(option);
    });

    return statusSelect;
}

async function getTypeSelect(){
    const type =  $(`<select class="form-field" id="type"></select>`);
    type.append(`<option value="">Select a Type</option>`);

    types.forEach(async typeOption =>{
        const option = $(`<option value='${typeOption}'>${typeOption}</option>`);
        type.append(option);
    })

    return type;
}

async function getGroupSelect(){
    const group = $(`<select class="form-field" id="group"></select>`);
    const url = `https://${domain}.freshdesk.com/api/v2/groups`;
    console.log(url);
    const response = await fetch(url, {
        method: 'GET',
        headers:{
            'Authorization':  'Basic ' + btoa(key + ':' + 'X'),
            'Content-Type' : 'application/json'
        }
    })
    const groupOptions = await  response.json();
    
    console.log(groupOptions);
    group.append(`<option value="">Select a Group</option>`);
    groupOptions.forEach(async groupOption => {
        const option = $(`<option value="${groupOption.id}">${groupOption.name}</option>`);
        group.append(option);
    });

    return group;
}

async function displayTicketsInit(){
   await displayTickets(1);
}

async function displayTickets(page){
    main.html("");
    const insideMain = $(`<div></div>`);
    main.addClass('main-bg');
    const tickets = await getTickets(page);

    tickets.forEach(async ticket => {
        // main.append(`<p>${ticket.subject}</p>`);
        const ticketRow = $(`<div class="row ticket"></div>`);
        const ticketCol = $(`<div class="col-md-12"></div>`);
        const ticketInfoRow = $(`<div class="row"></div>`);
        const description = await getDesc(ticket);
        ticketInfoRow.append(description);

        const updateCol = await getUpdate(ticket);
        ticketInfoRow.append(updateCol);

        ticketCol.append(ticketInfoRow);
        ticketRow.append(ticketCol);
        insideMain.append(ticketRow);
    });
    main.html(insideMain);
}

async function getUpdate(ticket){
    const updateCol = $(`<div class='col-md-5'></div>`);
    const updateflex = $(`<div class="update-flex"></div>`);

    const priorityCol =await getPriorityCol(ticket);
    updateflex.append(priorityCol);

    const editCol = await getEditCol(ticket);
    
    updateflex.append(editCol);

    updateCol.append(updateflex);
    
    return updateCol;
}

async function getEditCol(ticket){
    const editCol = $(`<div class="edit-flex"></div>`);

    // const editBtn = $(`<button class='btn edit-btn small-text' name="edit"><i class="fa fa-edit"></i>Edit</button>`);
    const editBtn = $(`<span class="action"><i class="fa fa-edit fa-2x edit-btn"></i><span>Edit</span></span>`);
    editCol.append(editBtn);

    editBtn.on('click', async function(){
        const ticketObj = await getTicket(ticket.id)
        editTicket(ticketObj);
    });

    // const closeBtn = $(`<button class="btn close-btn small-text" name="close">Close</button>`);
    const closeBtn = $(`<span  class="action"><i class="fa fa-check fa-2x close-btn" aria-hidden="true"></i><span>Close</span></span>`);
    editCol.append(closeBtn);

    closeBtn.on('click', async function(){
        const closed = await closeTicket(ticket);
        if(closed){
            const statusDisplay = editCol.parent().parent().parent().children().first().children().first().children().first().children().first()
            statusDisplay.text('Closed');
            statusDisplay.addClass('s-5');
        }
    })

    // const deleteBtn = $(`<button class="btn delete-btn small-text" name="delete">Delete</button>`);
    const deleteBtn = $(`<span class="action"><i class="fa fa-trash fa-2x delete-btn"></i><span>Delete</span></span>`);
    editCol.append(deleteBtn);

    deleteBtn.on('click', async function(){
        if(confirm(`Do you want to delete this ticket? - Ticket ${ticket.id}`)){
            const deletedResponse = await deleteTicket(ticket);
            console.log(deletedResponse);

            if(deletedResponse.status == 204){
                editCol.parent().parent().parent().parent().parent().remove();
                const notify = $(`#notify-message`)
                notify.text('Ticket Deleted');
                notify.fadeIn('slow').delay(3000).fadeOut('slow');

            }else{
                alert(`Ticket deletion isn't successful.`);
            }
        }

    });

    return editCol;
}

async function closeTicket(ticket){
    const updatedTicketResponse= await updateTicket(ticket, {"status": 5});

    console.log(updatedTicketResponse);

    if(updatedTicketResponse.errors){
        alert(updatedTicketResponse.errors[0].message);
        return false;
    }else{
        const notify = $(`#notify-message`)
        notify.text('Ticket Closed');
        notify.fadeIn('slow').delay(3000).fadeOut('slow');

        return true;
    }
}

async function editTicket(ticket){
    console.log(ticket);
    main.html("")
    main.removeClass('main-bg');
    const ticketForm = await getTicketForm(true, ticket);
    main.append(ticketForm);
    
}

async function getPriorityCol(ticket){

    const priorityCol = $(`<div class="priority"></div>`);
    const priorityDiv = $(`<div class='line-flex'></div>`);
    const priorityIcon = $(`<div class='small-icon'><i class="fa fa-square fa-s"></i></div>`);
    const priority = $(`<p class="small-text"></p>`);
    priority.text(`${priorityCodes[ticket.priority]}`)
    priorityIcon.addClass(`pri-${ticket.priority}`);
    priorityDiv.append(priorityIcon);
    priorityDiv.append(priority);

    priorityCol.append(priorityDiv);

    return priorityCol;
}

async function getDesc(ticket){
    const descCol= $(`<div class="col-md-7 desc"></div>`);
    const descFlex = $(`<div class="desc-flex"></div>`);

    const statusTags = $(`<div class="status-tags"></div>`);

    const status = $(`<span class="status">${statusCodes[ticket.status]}</span>`);
    status.addClass("s-" + ticket.status);
    statusTags.append(status);

    if(ticket.tags.length > 0){
        const tagsLength = ticket.tags.length;
        for(let i = 0; i < tagsLength && i < 3 ; i++ ){
            const tag = $(`<span class='tags'>${ticket.tags[i]}</span>`);
            statusTags.append(tag);
        }
    }

    descFlex.append(statusTags);


    const subject = $(`<p>${ticket.subject}</p>`);
    subject.addClass('subject');
    descFlex.append(subject);

    const aboutDiv = $(`<div class="about-flex"></div>`);
    const contactName = $(`<span class="contact-name small-text bold"></span>`);
    const contact = await getContact(ticket.requester_id);
    
    if(ticket.company_id){
        const company = await getCompany(ticket.company_id);
        contactName.append(`${contact.name}(${company.name})`);
    }else{
        contactName.append(contact.name);
    }
    aboutDiv.append(contactName);


    const created= getCreatedText(ticket);
    aboutDiv.append(created);
    

    const dueTime = getDueTime(ticket);
    aboutDiv.append(dueTime);

    descFlex.append(aboutDiv);
    
    descCol.append(descFlex);

    return descCol;
}

function getDueTime(ticket){
    const dueTime = $(`<p class="small-text grey"></p>`);
    const firstResponseDue = new Date(ticket.fr_due_by);
    const currentDate = new Date();

    const firstResponseDueMinutes = Math.floor((firstResponseDue - currentDate)/ (60*1000));
    if(firstResponseDueMinutes > 0){
       if(firstResponseDueMinutes < 60){
            dueTime.text(`First response due in ${firstResponseDueMinutes} ${firstResponseDueMinutes == 1 ? 'minute' : 'minutes'}.`);
       }else{
            const firstResponseDueHour = Math.floor((firstResponseDue - currentDate)/ (60*60*1000));
            if(firstResponseDueHour < 25){
                dueTime.text(`First response due in ${firstResponseDueHour} ${firstResponseDueHour == 1 ? 'hour' : 'hours'}.`);
            }else{
                const firstResponseDueDay = Math.floor((firstResponseDue - currentDate)/ (24*60*60*1000));
                dueTime.text(`First response due in ${firstResponseDueDay} ${firstResponseDueDay == 1 ? 'day' : 'days'}.`);
            }
       }
    }else{
        const due = new Date(ticket.due_by);
        const dueMinutes =  Math.floor((due - currentDate)/ (60*1000));
        if(dueMinutes > 0){
            if(dueMinutes < 60){
                dueTime.text(`Due in ${dueMinutes} ${dueMinutes == 1 ? 'minute' : 'minutes'}.`);
           }else{
                const dueHour = Math.floor((due - currentDate)/ (60*60*1000));
                if(dueHour < 25){
                    dueTime.text(`First response due in ${dueHour} ${dueHour == 1 ? 'hour' : 'hours'}.`);
                }else{
                    const dueDay = Math.floor((due - currentDate)/ (24*60*60*1000));
                    dueTime.text(`First response due in ${dueDay} ${dueDay == 1 ? 'day' : 'days'}.`);
                }
           }
        }else{
            const dueDate = due.toLocaleDateString();
            dueTime.text(`Overdue`);
            dueTime.addClass('red');
        }
    }

    return dueTime;
}

function getCreatedText(ticket){
    const created= $(`<p  class="small-text grey"></p>`);
    const createdTime = ticket.created_at;
    const currentDate = new Date();
    const createdDate = new Date(createdTime);
    const hourDifference = Math.floor((currentDate - createdDate)/ (60*60*1000));
    if(hourDifference < 25){
        if(hourDifference <= 0){
            const minuteDifference = Math.floor((currentDate - createdDate)/ (60*1000));
            if(minuteDifference == 0){ 
                // const secondDifference = Math.floor((currentDate - createdDate)/ (1000));
                // created.text(`Created ${secondDifference} ${secondDifference == 1 ? 'second' : 'second'} ago.`);
                created.text(`Created just now`);
            }else{
                created.text(`Created ${minuteDifference} ${minuteDifference == 1 ? 'minute' : 'minutes'} ago.`);
            }
        }else{
            created.text(`Created ${hourDifference} ${hourDifference == 1 ? 'hour' : 'hours'} ago.`);
        }
    }else{
        const dayDifference = Math.floor((currentDate - createdDate)/ (24*60*60*1000));
        created.text(`Created ${dayDifference} ${dayDifference == 1 ? 'day' : 'days'} ago.`);
    }

    return created;
}


function createTicketTable(){
    const table = $(`<table>`);
    const tableHeadRow = $(`<tr>`);
    table.append(tableHeadRow);
    const editTableHead = $(`<th>`);
    tableHeadRow.append(editTableHead);
    const contactHead = $(`<th>`);
    tableHeadRow.append(contactHead);   
}

async function getAgents(){
    const url = `https://${domain}.freshdesk.com/api/v2/agents`;
    console.log(url);
    try{
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization':  'Basic ' + btoa(key + ':' + 'X'),
                'Content-Type' : 'application/json'
            }
        });

        const agents = await response.json();

        return agents;
    }catch(err){
        console.log(err);
    }
}

async function getAgent(id){
    const url = `https://${domain}.freshdesk.com/api/v2/agents/${id}`;
    console.log(url);
    try{
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization':  'Basic ' + btoa(key + ':' + 'X'),
                'Content-Type' : 'application/json'
            }
        });

        const agent = await response.json();

        return agent;
    }catch(err){
        console.log(err);
    }
}


async function getContacts(){
    const url = `https://${domain}.freshdesk.com/api/v2/contacts`;
    console.log(url);
    try{
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization':  'Basic ' + btoa(key + ':' + 'X'),
                'Content-Type' : 'application/json'
            }
        });

        const contacts = await response.json();

        return contacts;
    }catch(err){
        console.log(err);
    }
}

async function getContact(id){
    const url = `https://${domain}.freshdesk.com/api/v2/contacts/${id}`;
    console.log(url);
    try{
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization':  'Basic ' + btoa(key + ':' + 'X'),
                'Content-Type' : 'application/json'
            }
        });

        if(response.statusCode == 404){
            return false;
        }else{
            const contact = await response.json();

            return contact;
        }

        
    }catch(err){
        console.log(err);
    }
}

async function getCompany(id){
    const url = `https://${domain}.freshdesk.com/api/v2/companies/${id}`;

    try{
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization':  'Basic ' + btoa(key + ':' + 'X'),
                'Content-Type' : 'application/json'
            }
        });

        // console.log(response);

        const company = await response.json();

        return company;
    }catch(err){
        console.log(err);
    }
}


async function getTicket(id){
    const url = `https://${domain}.freshdesk.com/api/v2/tickets/${id}`; 

    try{
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization':  'Basic ' + btoa(key + ':' + 'X'),
                'Content-Type' : 'application/json'
            }
        });

        const ticket = await response.json();
        return ticket;
    }catch(err){
        console.log('Error Occured while Fetching tickets');
        console.log(err);
    }
}


async function getTickets(page){
    const url = `https://${domain}.freshdesk.com/api/v2/tickets?per_page=${perPage}&page=${page}`; 

    try{
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization':  'Basic ' + btoa(key + ':' + 'X'),
                'Content-Type' : 'application/json'
            }
        });

        const tickets = await response.json();
        return tickets;
    }catch(err){
        console.log('Error Occured while Fetching tickets');
        console.log(err);
    }
}


async function createTicket(ticket){
    const url = `https://${domain}.freshdesk.com/api/v2/tickets`;

    try{
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization':  'Basic ' + btoa(key + ':' + 'X'),
                'Content-Type' : 'application/json'
            },
            body: JSON.stringify(ticket)
        });

        const createdticket = await response.json();
        return createdticket ;
    }catch(err){
        console.log('Error Occured while creating ticket');
        console.log(err);
    }
}


async function updateTicket(existingTicket,ticket){
    const url = `https://${domain}.freshdesk.com/api/v2/tickets/${existingTicket.id}`;
    
    try{
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization':  'Basic ' + btoa(key + ':' + 'X'),
                'Content-Type' : 'application/json'
            },
            body: JSON.stringify(ticket)
        });

        const updatedticket = await response.json();
        return updatedticket ;
    }catch(err){
        console.log('Error Occured while creating ticket');
        console.log(err);
    }
}

async function deleteTicket(ticket){
    const url = `https://${domain}.freshdesk.com/api/v2/tickets/${ticket.id}`;
    
    try{
        const deletedResponse = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization':  'Basic ' + btoa(key + ':' + 'X'),
                'Content-Type' : 'application/json'
            },
            body: JSON.stringify(ticket)
        });
        
        // const deletedResponseJson = await deletedResponse.json();
        console.log(deletedResponse);
        // console.log(deletedResponseJson);
        return deletedResponse ;
    }catch(err){
        console.log('Error Occured while deleting ticket');
        console.log(err);
    }
}