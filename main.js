API = "https://rex.mit.edu/api.json";
fetch(API).then(response => response.json()).then(data => {
    console.log(data);
});

function makeEvent(event, config) {
    let name = event.name;
    let start_date = new Date(event.start);
    let end_date = new Date(event.end);
    
    let rex_start = new Date(config.start) - 1000 * 60 * 60 * 12;
    let rex_end = new Date(config.end);
    let start_pos = (start_date - rex_start) / (rex_end - rex_start) * 10000;
    let width = (end_date - start_date) / (rex_end - rex_start) * 10000;
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

Vue.component('event-modal', {
    props: ['event', 'visible'],
    template: `
    <div class="modal" v-if="visible">
        <div class="modal-content">
            <span class="close" @click="close">&times;</span>
            <h2>{{ event.name }}</h2>
            <p>{{ event.description }}</p>
            <p>{{ event.location }}</p>
            <p>{{ event.start.toLocaleTimeString() }}-{{ event.end.toLocaleTimeString() }}</p>
            <p v-bind:style="'color:'+schedule.config['colors']['dorms'][event.dorm[0]]">{{ event.dorm[0] }}</p>
            <div>
                <div v-for="tag in event.tags" class="tag" :style="'background-color:'+schedule.config['colors']['tags'][tag]">{{ tag }}</div>
            </div>
        </div>
    </div>`,
    methods: {
        close: function() {
            this.visible = false;
        }
    }
});

function show(event) {
    console.log(event);
    modal.event = event;
    modal.visible = true;
}

let modal = new Vue({
    el: '#modal',
    data: {
        visible: false,
        event: {}
    }
})

Vue.component('events-track', {
    props: ['events', 'config'],
    template: `
    <div class="event-grid">
        <div v-for="event in events">
            <div class="event" v-bind:style="'left:'+event.start_pos+'px;width:'+event.width+'px'">
                <div class="card" v-bind:style="'background-color:'+config['colors']['dorms'][event.dorm[0]]" @click="show(event)">
                    <b><p>{{ event.name }}</p></b>
                    <p>{{ event.start.toLocaleTimeString() }}-{{ event.end.toLocaleTimeString() }}</p>
                </div>
            </div>
        </div>
    </div>`
});

Vue.component('events-schedule', {
    props: ['tracks', 'config'],
    template: `
    <div class="events-schedule">
        <div v-for="track in tracks">
            <events-track :events="track" :config="config"></events-track>
        </div>
    </div>`
});

let schedule = new Vue({
    el: '#app',
    data: {
        tracks: [],
        config: {}
    },
    mounted() {
        fetch(API).then(response => response.json()).then(data => {
            this.config = data;
            this.events_all = makeEventObjects(data.events, this.config);
            this.tracks = makeSchedule(this.events_all);
            console.log(this.tracks);
            console.log(this.config);
        });
    },
});

new Vue({
    el: '#search'
});

function update(e) {
    let text = e.target.value;
    let filtered = [];
    for (let event of schedule.events_all) {
        if (JSON.stringify(event).toLowerCase().includes(text)) {
            filtered.push(event);
        }
    }
    schedule.tracks = makeSchedule(filtered, schedule.config);
}
