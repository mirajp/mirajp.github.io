<template>
    <div>
        <v-container>
            <v-layout justify-center wrap>
                <v-flex text-xs-center mb-3 xs12>
                    <h1 class="display-2 font-weight-bold">Experiences</h1>
                </v-flex>
            </v-layout>
        </v-container>
        <div>
            <v-layout justify-center wrap>
                <v-flex mx-3 px-1 class="experiences-content" :class="$mq | mq({mobile: 'xs11', tablet: 'xs7'})">
                    <v-expansion-panel v-model="selected" @input="onSelectionChange" :dark="false" focusable popout>
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
                                <v-card-text v-html="experience.description"></v-card-text>
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
    cooper: {
        image:
            "https://lh5.googleusercontent.com/p/AF1QipMUjWIFz0-EgjfIikStdNVRCLKTVe-ZmeEausc8=w203-h152-k-no",
        imageSize: [64, 48],
        lat: 40.728676,
        lng: -73.990121,
        placeId: "ChIJw0Jyc5tZwokRiUlYgQpGE6A",
        zoom: 18
    },
    conEd: {
        image:
            "https://www.coned.com/-/media/images/coned/07_about-coned/72_careers/about-us-cd.jpg",
        imageSize: [48, 64],
        lat: 40.734074,
        lng: -73.987904,
        placeId: "ChIJ6xMfG81KwokRmS2aPAToHOc",
        zoom: 16.75
    },
    google: {
        image:
            "https://lh5.googleusercontent.com/p/AF1QipNKhKHnqfkXPp2WKUMsipDpezAz9GB05P-hHwMP=s1016-k-no",
        imageSize: [64, 64],
        lat: 37.403498,
        lng: -122.035999,
        placeId: "ChIJXz2lB6e3j4ARSDB210CbuE0",
        zoom: 16.75
    },
    high5: {
        image:
            "https://lh5.googleusercontent.com/p/AF1QipPjoyq6ms6p2V45_5Ql6vPE1H3GNqKmKH5xx5xE=w203-h116-k-no",
        imageSize: [64, 32],
        lat: 40.712741,
        lng: -74.013263,
        placeId: "ChIJk51YMBpawokRuYslbbMVIog",
        zoom: 16.75
    },
    highbridge: {
        image:
            "https://www.martingroupservices.com/wp-content/uploads/2019/01/Picture-2-e1459806839343.jpg",
        imageSize: [64, 32],
        lat: 40.76373,
        lng: -73.976326,
        placeId: "ChIJMRtanfBYwokRGJCJs7Vdkfk",
        zoom: 15.75
    },
    microsoft: {
        image:
            "https://lh3.googleusercontent.com/proxy/GUVCiZfdxPl2196mcdeneotY98WaLsKLZEuLKVzf47HU2T8t8RtQSn23bAWybz_An3GefGHyC6g4gyJM5cqmlMY4fSPkQK283XF27ElPH5zvtCNbx3PMppiozSmuFQ",
        imageSize: [64, 48],
        lat: 47.646849,
        lng: -122.133132,
        placeId: "ChIJ3aK9H29tkFQRVxqMRoCeZCA",
        zoom: 16
    },
    nycsca: {
        image:
            "https://s3-media1.fl.yelpcdn.com/bphoto/rGXN8U-bURJXL4SXawpwPg/o.jpg",
        imageSize: [48, 48],
        lat: 40.744872,
        lng: -73.935965,
        placeId: "ChIJvUFiy9RewokRqW30mdspZaE",
        zoom: 14
    },
    qhss: {
        image:
            "https://lh5.googleusercontent.com/p/AF1QipOE7XW9OvVlO8DCT6A1ecaEsagcuZQgkdXDrqDy=w203-h360-k-no",
        imageSize: [48, 48],
        lat: 40.700928,
        lng: -73.798312,
        placeId: "ChIJcz3WsdlgwokRzh5TVkk0nTg",
        zoom: 17
    },
    library: {
        image:
            "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/45393617730611.562be4fd42d0e.jpg",
        imageSize: [64, 48],
        lat: 40.757789,
        lng: -73.828914,
        placeId: "ChIJmaf80mxgwokRbFh-95Kek3k",
        zoom: 18
    }
};

const experiences = [
    {
        title: "Google",
        location: locations.google,
        start: "May 2020",
        end: "Present",
        icon: "fas fa-spinner fa-spin",
        iconColor: "primary",
        description: `
            - Organize the world's information and make it universally accessible and useful
        `
    },
    {
        title: "Microsoft",
        location: locations.microsoft,
        start: "Jun 2018",
        end: "Apr 2020",
        icon: "fab fa-windows",
        iconColor: "success",
        description: `
            - Revamp legacy Knockout web application as a React SPA conforming to Fluent UI company standard using modern open source guidelines and frameworks (e.g. Office Fabric UI and React Json Schema Form) <br>
            - Published (internal) documentation for ramping up to company standards and the team's development, testing, and deployment practices, as well as user-level technical documentation for application components <br>
            - Actively integrate new commercial product management scenarios for service validation and user acceptance testing <br>
            - Coordinated with partner service teams to re-architect unwieldy or unintuitive customer scenarios <br>
            - Perform C# and JS code reviews to help ensure conformity to company guidelines and best practices, as well as recommend re-design when appropriate <br>
            - Built CI/CD pipelines on Azure DevOps for streamlined integration and UAT testing and release into multiple environments
        `
    },
    {
        title: "Highbridge Capital Management",
        location: locations.highbridge,
        start: "May 2017",
        end: "May 2018",
        icon: "fas fa-chart-line",
        iconColor: "success",
        description: `
            - Architected a real-time trade processing system using Apache Kafka (message queue) on distributed systems for fault tolerance and disaster recovery <br>
            - Architected microservices for regulation-mandated trade reporting and optimization of treasury analysts' daily workflows <br>
            - Developed web apps with intuitive event-driven Angular and Vue.js frontends for various stakeholders including traders, internal developers, and managing directors <br>
            - Developed developer-oriented RESTful API (Swagger/OpenAPI specification-compliant) for trade manipulation in order to reduce manual entry/checks at end-of-day <br>
            - Designed a more modern UI/UX of legacy web applications to establish internal starter kit with standardized company theme and lightweight authentication and authorization backend service <br>
            - Configured Jenkins jobs for automated builds, Maven deployment, and releases into QA and Production environments <br>
            - Optimized ETL procedures on SQL Server; reduced the runtime of audit-related backups by ~67%
        `
    },
    {
        title: "Cooper Union (Master of Engineering)",
        location: locations.cooper,
        start: "Sep 2016",
        end: "Dec 2017",
        icon: "fas fa-chalkboard-teacher",
        iconColor: "success",
        description: `
            Received half-tuition scholarship at The Cooper Union for the duration of the Master's program. <br>
            Majored in Electrical Engineering and completed a Natural Language Processing-focused thesis to meet the requirements for an Electrical Engineering Master of Engineering degree.
        `
    },
    {
        title: "ConEdison",
        location: locations.conEd,
        start: "May 2015",
        end: "Aug 2017",
        icon: "fas fa-bolt",
        iconColor: "success",
        description: `
            - Developed a dashboard on Google Maps to that allows management to prioritize Manhattan's electric network repair in accordance with urgency and customer impact <br>
            - Rectified over 20% customer data using NYC Open Data and Google Maps Web Services APIs <br>
            - Developed VBScript and Excel-related productivity tools to reduce manual effort and time required for data entry and analysis by over 50% <br>
            - Redesigned department's SharePoint site, document libraries, online forms, and Nintex workflows
        `
    },
    {
        title: "High 5 Games",
        location: locations.high5,
        start: "Jun 2014",
        end: "Aug 2014",
        // icon: "mdi-dice-multiple",
        icon: "fas fa-dice",
        iconColor: "success",
        description: `
            - Developed multiplayer Bingo prototype with XML configurable Java server, and Flash (AS3) client <br>
            - Facebook platform worthy game with various choices in game modes, play speed, costs, and payouts <br>
            - QA tested Shake The Sky video poker and High 5 Casino slot games <br>
            - Developed XML configurable mini-game prototypes of popular casino dice and card games <br>
            - Created in-house productivity tools for speeding up time consuming processes involving localization and slot pay lines visualization
        `
    },
    {
        title: "Cooper Union (Bachelor of Engineering)",
        location: locations.cooper,
        start: "Sep 2012",
        end: "May 2016",
        icon: "fas fa-graduation-cap",
        iconColor: "success",
        description: `
            Received full tuition scholarship at The Cooper Union for Fall 2012 to Spring 2016. <br>
            Majored in Electrical Engineering (the Computer Engineering track) and earned a Bachelor of Engineering degree.
        `
    },
    {
        title: "NYC School Construction Authority",
        location: locations.nycsca,
        start: "June 2012",
        end: "Aug 2012",
        icon: "fas fa-tools",
        iconColor: "success",
        description: `
            - Managed network/domain access for newly rolled out PCs for employees of other departments <br>
            - Imaged PCs to meet company standards for work and special design use for architects and engineers <br>
            - Digitized records of employees/contractors and environmental school site data reports for network accessibility and possible future litigation
        `
    },
    {
        title: "Queens High School for the Sciences",
        location: locations.qhss,
        start: "Sep 2008",
        end: "Jun 2012",
        icon: "fas fa-school",
        iconColor: "success",
        description: `
            Advanced Regents Diploma with Honors + National AP Scholar: <br>
            AP Calculus BC, AP Statistics, AP Chemistry, AP Physics B, AP World History, AP US History, AP English Language, AP English Literature, AP Government
        `
    },
    {
        title: "Flushing Public Library",
        location: locations.library,
        start: "2009",
        end: "2011",
        icon: "fas fa-book-reader",
        iconColor: "success",
        description: `
            - Assisted the senior staff with daily transactions <br>
            - Organized records of library transactions <br>
            - Assisted customers with their needs, including teaching the customers how to use the library and all its resources
        `
    }
];

function createMarker(map, place, locationRef, onClick) {
    const markerImage = {
        url: locationRef.image,
        /*
            (place.photos &&
                place.photos.length &&
                place.photos[0].getUrl({
                    maxWidth: 128,
                    maxHeight: 128
                })) || place.icon */
        // eslint-disable-next-line no-undef
        size: new google.maps.Size(...(locationRef.imageSize || [128, 128])),
        // eslint-disable-next-line no-undef
        origin: new google.maps.Point(0, 0),
        // eslint-disable-next-line no-undef
        anchor: new google.maps.Point(24, 24),
        // eslint-disable-next-line no-undef
        scaledSize: new google.maps.Size(
            ...(locationRef.imageSize || [128, 128])
        )
    };
    // eslint-disable-next-line no-undef
    const marker = new google.maps.Marker({
        map: map,
        icon: markerImage,
        title: place.name,
        position: place.geometry.location
    });

    locationRef.marker = marker;
    locationRef.place = place;
    locationRef.placeId = place.placeId;
    locationRef.url = place.url;
    marker.addListener("click", function() {
        onClick && onClick(marker, locationRef);
    });
}

export default {
    mounted() {
        const selectedLocation = experiences[this.selected].location;
        // eslint-disable-next-line no-undef
        this.map = new google.maps.Map(document.getElementById("map"), {
            center: selectedLocation,
            zoom: selectedLocation.zoom || 17.75
        });

        // eslint-disable-next-line no-undef
        const service = new google.maps.places.PlacesService(this.map);
        this.placesService = service;
        // eslint-disable-next-line no-undef
        const infoWindow = new google.maps.InfoWindow();
        this.infoWindow = infoWindow;
        /*
        this.markers = Object.keys(locations).map(location => {
            // eslint-disable-next-line no-undef
            return new google.maps.Marker({
                position: locations[location],
                map: this.map
            });
        });
        */
        Object.keys(locations).map(location => {
            service.getDetails(
                {
                    placeId: locations[location].placeId,
                    fields: [
                        "name",
                        "formatted_address",
                        "geometry",
                        "icon",
                        "photo",
                        "place_id",
                        "url"
                    ]
                },
                (place, status) => {
                    // eslint-disable-next-line no-undef
                    if (status == google.maps.places.PlacesServiceStatus.OK) {
                        createMarker(
                            this.map,
                            place,
                            locations[location],
                            this.onMarkerClick
                        );
                    }
                }
            );
        });
    },
    data: () => ({
        experiences,
        infoWindow: null,
        selected: 0
    }),
    methods: {
        onMarkerClick(marker, locationRef) {
            const place = locationRef.place;
            this.infoWindow.setContent(
                `<div class="info-window">
                    <strong>${place.name}</strong>
                    <br>
                    ${place.formatted_address}
                    <br>
                    <a href="${place.url}">View on Google Maps</a>
                </div>`
            );
            this.infoWindow.open(this.map, marker);
        },
        onSelectionChange(selectedIndex) {
            this.infoWindow.close();
            const selectedExperience = experiences[selectedIndex];
            this.map.setCenter(
                selectedExperience.location.place.geometry.location
            );
            this.map.setZoom(19);
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

.info-window {
    color: black;
    max-width: 30ch;
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
