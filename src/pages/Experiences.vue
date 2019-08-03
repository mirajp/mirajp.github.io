<template>
    <div>
        <v-container>
            <v-layout justify-center wrap>
                <v-flex text-xs-center mb-3 xs12>
                    <div class="display-2 font-weight-bold">Experiences</div>
                </v-flex>
            </v-layout>
        </v-container>
        <div>
            <v-layout justify-center wrap>
                <v-flex mx-3 px-1 class="experiences-content" :class="$mq | mq({mobile: 'xs11', tablet: 'xs7'})">
                    <v-expansion-panel v-model="selected" @input="onSelectionChange" :dark="false" focusable inset mandatory popout>
                        <v-expansion-panel-content v-for="experience in experiences" :key="experience.title">
                            <template v-slot:header>
                                <v-layout>
                                    <v-flex xs9>{{ experience.title }}</v-flex>
                                    <v-flex xs3 class="text--secondary experience-time">{{ experience.start }} - {{ experience.end }}</v-flex>
                                </v-layout>
                            </template>
                            <template v-slot:actions>
                                <v-icon :color="experience.iconColor">{{ experience.icon }}</v-icon>
                            </template>
                            <v-card>
                                <v-card-text>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</v-card-text>
                            </v-card>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                </v-flex>
                <v-flex v-show="$mq !== 'mobile'" ma-3 pa-1 xs3>
                    <div class="map-container">
                        <div id="map"></div>
                    </div>
                </v-flex>
            </v-layout>
        </div>
    </div>    
</template>

<script>
const locations = {
    cooper: { lat: 40.728676, lng: -73.990121, zoom: 18 },
    conEd: { lat: 40.734074, lng: -73.987904, zoom: 16.75 },
    high5: { lat: 40.712741, lng: -74.013263, zoom: 16.75 },
    highbridge: { lat: 40.76373, lng: -73.976326, zoom: 15.75 },
    microsoft: { lat: 47.646849, lng: -122.133132, zoom: 16 },
    nycsca: { lat: 40.744872, lng: -73.935965, zoom: 14 },
    qhss: { lat: 40.700928, lng: -73.798312, zoom: 17 }
};

const experiences = [
    {
        title: "Microsoft",
        start: "Jun 2018",
        end: "Present",
        icon: "fas fa-spinner fa-spin",
        iconColor: "primary",
        description: "Lorem ipsum",
        location: locations.microsoft
    },
    {
        title: "Highbridge Capital Management",
        start: "May 2017",
        end: "May 2018",
        icon: "fas fa-chart-line",
        iconColor: "success",
        description: "Lorem ipsum",
        location: locations.highbridge
    },
    {
        title: "Cooper Union",
        start: "Sep 2016",
        end: "Dec 2017",
        icon: "fas fa-chalkboard-teacher",
        iconColor: "success",
        description: "Lorem ipsum",
        location: locations.cooper
    },
    {
        title: "ConEdison",
        start: "May 2015",
        end: "Aug 2017",
        icon: "fas fa-bolt",
        iconColor: "success",
        description: "Lorem ipsum",
        location: locations.conEd
    },
    {
        title: "High 5 Games",
        start: "Jun 2014",
        end: "Aug 2014",
        // icon: "mdi-dice-multiple",
        icon: "fas fa-dice",
        iconColor: "success",
        description: "Lorem ipsum",
        location: locations.high5
    },
    {
        title: "Cooper Union",
        start: "Sep 2012",
        end: "May 2016",
        icon: "fas fa-graduation-cap",
        iconColor: "success",
        description: "Lorem ipsum",
        location: locations.cooper
    },
    {
        title: "NYC School Construction Authority",
        start: "June 2014",
        end: "Aug 2014",
        icon: "fas fa-tools",
        iconColor: "success",
        description: "Lorem ipsum",
        location: locations.nycsca
    },
    {
        title: "QHSS",
        start: "Sep 2008",
        end: "Jun 2012",
        icon: "fas fa-school",
        iconColor: "success",
        description: "Lorem ipsum",
        location: locations.qhss
    }
];

export default {
    mounted() {
        const selectedLocation = experiences[this.selected].location;
        // eslint-disable-next-line no-undef
        this.map = new google.maps.Map(document.getElementById("map"), {
            center: selectedLocation,
            zoom: selectedLocation.zoom || 17.75
        });
        this.markers = Object.keys(locations).map(location => {
            // eslint-disable-next-line no-undef
            return new google.maps.Marker({
                position: locations[location],
                map: this.map
            });
        });
    },
    data: () => ({
        experiences,
        selected: 0
    }),
    methods: {
        onSelectionChange(selectedIndex) {
            const selectedExperience = experiences[selectedIndex];
            this.map.setCenter(selectedExperience.location);
            this.map.setZoom(selectedExperience.location.zoom || 17.75);
        }
    }
};
</script>

<style>
.experiences-content {
    margin-top: -16px;
}

.experience-time {
    font-size: smaller !important;
    margin-right: 0.25em;
    text-align: right;
}

.map-container {
    position: fixed !important;
    width: 30%;
}

#map {
    height: 100%;
    min-height: 20rem;
}

div.experiences-content
    > ul.v-expansion-panel
    > li.v-expansion-panel__container
    > div.v-expansion-panel__header {
    line-height: 2em;
    margin: 0.25rem 1rem;
    padding: 0 !important;
}

.v-expansion-panel__header__icon {
    margin-left: 0.25rem;
}

/*
.v-expansion-panel__header__icon > i.v-icon.mdi {
    font-size: xx-large;
}
*/

.v-expansion-panel__container--active
    > .v-expansion-panel__header
    .v-expansion-panel__header__icon
    .v-icon {
    transform: initial;
}
</style>
