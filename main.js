API = "https://rex.mit.edu/api.json";
function timeStr(date) {
    return date.toLocaleTimeString("en-us", {hour: "2-digit", minute: "2-digit"})
}

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

Vue.component('event-modal', {
    props: ['event', 'visible'],
    template: `
    <div class="modal" v-if="visible">
        <div class="modal-content">
            <span class="close" @click="close">&times;</span>
            <h2>{{ event.name }}</h2>
            <p>{{ event.description }}</p>
            <p>{{ event.location }}</p>
            <p>{{ timeStr(event.start) }}-{{ timeStr(event.end) }}</p>
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
    alert(event);
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
                <div class="card" v-bind:style="'background-color:'+config['colors']['dorms'][event.dorm[0]]" @click="show(event)" :style="'color:'+(event.dorm[0].includes('New') ? 'black':'white')">
                    <b><p>{{ event.name }}</p></b>
                    <p>{{ timeStr(event.start) }}-{{ timeStr(event.end) }}</p>
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
            timebar.make();
        });
    },
});

new Vue({
    el: '#search'
});

function update(e) {
    let text = e.target.value.toLowerCase();
    let filtered = [];
    for (let event of schedule.events_all) {
        if (JSON.stringify(event).toLowerCase().includes(text)) {
            filtered.push(event);
        }
    }
    schedule.tracks = makeSchedule(filtered, schedule.config);
}

Vue.component('time-bar', {
    props: ['times'],
    template: `
    <div class=time-bar>
        <div v-for="time in times" :style="'left:'+time.pos+'px'" class=time>
            {{ time.text }}
        </div>
    </div>
    `
})

let timebar = new Vue({
    el: "#timebar",
    data: {
        times:[],
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
                console.log(this.times);
            }            
        }
    }
})

window.onerror = function(msg, url, linenumber) {
    alert('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+linenumber);
}
