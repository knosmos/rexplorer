// COMPONENTS

Vue.component('events-track', {
    props: ['events', 'config', 'zoom'],
    template: `
    <div class="event-grid" :style="'background-size:'+100*zoom+'px'">
        <div v-for="event in events">
            <div class="event" v-bind:style="'left:'+event.start_pos*zoom+'px;width:'+event.width*zoom+'px'">
                <div class="card" v-bind:style="'background-color:'+config['colors']['dorms'][event.dorm[0]]" @click="show(event)" :style="'color:'+(event.dorm[0].includes('New') ? 'black':'white')">
                    <p>{{ event.name }}</p>
                    <p>{{ timeStr(event.start) }}-{{ timeStr(event.end) }}</p>
                </div>
            </div>
        </div>
    </div>`
});

Vue.component('events-schedule', {
    props: ['tracks', 'config', 'zoom'],
    template: `
    <div class="events-schedule">
        <div v-for="track in tracks">
            <events-track :events="track" :config="config" :zoom="zoom"></events-track>
        </div>
    </div>`
});

Vue.component('modal', {
    props: ['visible'],
    template: `
    <div id="ai" class="modal" v-if="visible" @click="close">
        <div class="modal-content" @click="blockClose">
            <span class="close" @click="close">&times;</span>
            <slot></slot>
        </div>
    </div>
    `,
    methods: {
        close: function() {
            this.visible = false;
        },
        blockClose: function(event) {
            event.stopPropagation();
        }
    }
})

// UTILITY
API = "https://rex.mit.edu/api.json";
AI_API = "https://rexplorer.onrender.com";

let starred = [];
if ("starred" in localStorage) {
    starred = JSON.parse(localStorage.getItem("starred"));
}

fetch(AI_API).then(response => {
    console.log("AI wakeup call successful");
})

function timeStr(date) {
    return date.toLocaleTimeString("en-us", {hour: "2-digit", minute: "2-digit"})
}

// SCHEDULE

function makeEvent(event, config) {
    let name = event.name;
    let start_date = new Date(event.start);
    let end_date = new Date(event.end);
    
    let rex_start = new Date(config.start) - 1000 * 60 * 60 * 12;
    let rex_end = new Date(config.end);
    let start_pos = (start_date - rex_start) / (1000 * 60 * 60) * 100;
    let width = (end_date - start_date) / (1000 * 60 * 60) * 100;
    return {
        name: name,
        start: start_date,
        end: end_date,
        start_pos: start_pos,
        width: width,
        dorm: event.dorm,
        description: event.description,
        location: event.location,
        tags: event.tags
    };
}

function makeEventObjects(events, config) {
    let event_objects = [];
    for (let e of events) {
        event_objects.push(makeEvent(e, config));
    }
    return event_objects;
}

function makeSchedule(event_objects) {
    let tracks = []; // non overlapping events
    event_objects.sort((a, b) => a.start - b.start);
    for (let event of event_objects) {
        let added = false;
        for (let track of tracks) {
            if (event.start >= track[track.length - 1].end) {
                track.push(event);
                added = true;
                break;
            }
        }
        if (!added) {
            tracks.push([event]);
        }
    }
    return tracks;
}

// EVENT MODAL

function show(event) {
    console.log(event);
    modal.event = event;
    modal.visible = true;
    modal.starevent = isStarred(event);
    modal.$forceUpdate();
}

let modal = new Vue({
    el: '#event-modal',
    data: {
        visible: false,
        event: {},
        starevent: false
    },
})

// SCHEDULE COMPONENTS

let schedule = new Vue({
    el: '#app',
    data: {
        tracks: [],
        config: {},
        zoom: 1
    },
    mounted() {
        fetch(API).then(response => response.json()).then(data => {
            this.config = data;
            this.events_all = makeEventObjects(data.events, this.config);
            this.tracks = makeSchedule(this.events_all);
            console.log(this.events_all);
            timebar.make();
        });
    },
});

// SEARCH

new Vue({
    el: '#search'
});

new Vue({
    el: '#starred'
});

let showStarred = false;
let searchString = "";

function update() {
    let filtered = filterSearch(schedule.events_all);
    if (showStarred) { filtered = filterStarred(filtered); }
    schedule.tracks = makeSchedule(filtered, schedule.config);
}

function updateSearch(e) {
    searchString = e.target.value.toLowerCase();
    update();
}

function updateStarred(e) {
    showStarred = e.target.checked;
    update();
}

function filterSearch(events) {
    let filtered = [];
    for (let event of events) {
        if (JSON.stringify(event).toLowerCase().includes(searchString)) {
            filtered.push(event);
        }
    }
    return filtered;
}

function isStarred(event) {
    let s = JSON.stringify(event);
    return starred.includes(s);
}

function toggleStar(event) {
    let s = JSON.stringify(event);
    if (isStarred(event)) {
        starred.splice(starred.indexOf(s), 1);
        modal.starevent = false;
    }
    else {
        starred.push(s);
        modal.starevent = true;
    }
    localStorage.setItem("starred", JSON.stringify(starred));
    modal.$forceUpdate();
}

function filterStarred(events) {
    let filtered = [];
    for (let event of events) {
        if (isStarred(event)) {
            filtered.push(event);
        }
    }
    return filtered;
}

// TIME BAR

let timebar = new Vue({
    el: "#timebar",
    data: {
        times:[],
        zoom:1,
    },
    methods: {
        make: function() {
            let rex_start = new Date(schedule.config.start) - 1000 * 60 * 60 * 12;
            let rex_end = new Date(schedule.config.end).getTime() + 1000 * 60 * 60 * 150;
            for (let i=rex_start; i<rex_end; i+=1000*60*60) {
                this.times.push({
                    "text": timeStr(new Date(i)),
                    "pos" : (i - rex_start) / (1000 * 60 * 60) * 100
                });
            }            
        }
    }
});

// ZOOM

new Vue({
    el: "#zoom-in",
    methods: {
        zoomIn: function() {
            schedule.zoom *= 1.1;
            timebar.zoom *= 1.1;
            schedule.$forceUpdate();
            timebar.$forceUpdate();
        },
    }
});

new Vue({
    el: "#zoom-out",
    methods: {
        zoomOut: function() {
            schedule.zoom /= 1.1;
            timebar.zoom /= 1.1;
        }
    }
});

// AI

new Vue({
    el: "#ai-button",
    methods: {
        showAIModal: function() {
            ai.visible = true;
            ai.$forceUpdate();
        }
    }
});

ai = new Vue({
    el: "#ai",
    data: {
        visible: false,
        search_results: [],
        processing: false
    },
    methods: {
        search: function() {
            this.processing = true;
            this.search_results = [];
            fetch(
                AI_API + "/search",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        "query": document.getElementById("search-query").value
                    })
                }
            ).then(response => response.json()).then(data => {
                this.processing = false;
                this.search_results = [];
                for (let e of data["results"]) {
                    this.search_results.push(makeEvent(e, schedule.config));
                }
                console.log(this.search_results);
                this.$forceUpdate();
            });
        }
    }
});

// About screen

about = new Vue({
    el: "#about",
    data: {
        visible: false
    }
});

new Vue({
    el: "#about-button",
    methods: {
        showAbout: function() {
            about.visible = true;
            about.$forceUpdate();
        }
    }
});