// screens.js

const screens = {

    6: {
        init() {
            resetDrawersForScreen6();
            initQCM(qcmData[6]);
        },

        destroy() {
            // rien pour le moment
        }

    },

    13: {
        init() {
            initDice();
        },

        destroy() {
        }

    },

    14: {
        init() {
            initModel();
        },

        destroy() {
        }

    }
};