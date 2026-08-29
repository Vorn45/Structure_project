import { animate, state, style, transition, trigger, } from '@angular/animations';
import { HelperAnimationCurves, HelperAnimationDurations, } from 'helper/animations/defaults';

// -----------------------------------------------------------------------------------------------------
// @ Fade in
// -----------------------------------------------------------------------------------------------------
const fadeIn = trigger('fadeIn', [
    state(
        'void',
        style({
            opacity: 0,
        })
    ),

    state(
        '*',
        style({
            opacity: 1,
        })
    ),

    // Prevent the transition if the state is false
    transition('void => false', []),

    // Transition
    transition('void => *', animate('{{timings}}'), {
        params: {
            timings: `${HelperAnimationDurations.entering} ${HelperAnimationCurves.deceleration}`,
        },
    }),
]);

// -----------------------------------------------------------------------------------------------------
// @ Fade in custom by Yim Klok
// -----------------------------------------------------------------------------------------------------
const fadeInCustom = trigger('fadeInCustom',
    [
        state('void',
            style({
                opacity: 0,
            }),
        ),

        state('*',
            style({
                opacity: 1,
            }),
        ),

        // Prevent the transition if the state is false
        transition('void => false', []),

        // Transition
        transition(':enter', [
            style({ opacity: 0 }),
            animate('0.8s ease-out', style({ opacity: 1 })),
        ]),
    ],
);

// -----------------------------------------------------------------------------------------------------
// @ Fade in top
// -----------------------------------------------------------------------------------------------------
const fadeInTop = trigger('fadeInTop', [
    state(
        'void',
        style({
            opacity: 0,
            transform: 'translate3d(0, -100%, 0)',
        })
    ),

    state(
        '*',
        style({
            opacity: 1,
            transform: 'translate3d(0, 0, 0)',
        })
    ),

    // Prevent the transition if the state is false
    transition('void => false', []),

    // Transition
    transition('void => *', animate('{{timings}}'), {
        params: {
            timings: `${HelperAnimationDurations.entering} ${HelperAnimationCurves.deceleration}`,
        },
    }),
]);

// -----------------------------------------------------------------------------------------------------
// @ Fade in bottom
// -----------------------------------------------------------------------------------------------------
const fadeInBottom = trigger('fadeInBottom', [
    state(
        'void',
        style({
            opacity: 0,
            transform: 'translate3d(0, 100%, 0)',
        })
    ),

    state(
        '*',
        style({
            opacity: 1,
            transform: 'translate3d(0, 0, 0)',
        })
    ),

    // Prevent the transition if the state is false
    transition('void => false', []),

    // Transition
    transition('void => *', animate('{{timings}}'), {
        params: {
            timings: `${HelperAnimationDurations.entering} ${HelperAnimationCurves.deceleration}`,
        },
    }),
]);

// -----------------------------------------------------------------------------------------------------
// @ Fade in left
// -----------------------------------------------------------------------------------------------------
const fadeInLeft = trigger('fadeInLeft', [
    state(
        'void',
        style({
            opacity: 0,
            transform: 'translate3d(-100%, 0, 0)',
        })
    ),

    state(
        '*',
        style({
            opacity: 1,
            transform: 'translate3d(0, 0, 0)',
        })
    ),

    // Prevent the transition if the state is false
    transition('void => false', []),

    // Transition
    transition('void => *', animate('{{timings}}'), {
        params: {
            timings: `${HelperAnimationDurations.entering} ${HelperAnimationCurves.deceleration}`,
        },
    }),
]);

// -----------------------------------------------------------------------------------------------------
// @ Fade in right
// -----------------------------------------------------------------------------------------------------
const fadeInRight = trigger('fadeInRight', [
    state(
        'void',
        style({
            opacity: 0,
            transform: 'translate3d(100%, 0, 0)',
        })
    ),

    state(
        '*',
        style({
            opacity: 1,
            transform: 'translate3d(0, 0, 0)',
        })
    ),

    // Prevent the transition if the state is false
    transition('void => false', []),

    // Transition
    transition('void => *', animate('{{timings}}'), {
        params: {
            timings: `${HelperAnimationDurations.entering} ${HelperAnimationCurves.deceleration}`,
        },
    }),
]);

// -----------------------------------------------------------------------------------------------------
// @ Fade out
// -----------------------------------------------------------------------------------------------------
const fadeOut = trigger('fadeOut', [
    state(
        '*',
        style({
            opacity: 1,
        })
    ),

    state(
        'void',
        style({
            opacity: 0,
        })
    ),

    // Prevent the transition if the state is false
    transition('false => void', []),

    // Transition
    transition('* => void', animate('{{timings}}'), {
        params: {
            timings: `${HelperAnimationDurations.exiting} ${HelperAnimationCurves.acceleration}`,
        },
    }),
]);

// -----------------------------------------------------------------------------------------------------
// @ Fade out top
// -----------------------------------------------------------------------------------------------------
const fadeOutTop = trigger('fadeOutTop', [
    state(
        '*',
        style({
            opacity: 1,
            transform: 'translate3d(0, 0, 0)',
        })
    ),

    state(
        'void',
        style({
            opacity: 0,
            transform: 'translate3d(0, -100%, 0)',
        })
    ),

    // Prevent the transition if the state is false
    transition('false => void', []),

    // Transition
    transition('* => void', animate('{{timings}}'), {
        params: {
            timings: `${HelperAnimationDurations.exiting} ${HelperAnimationCurves.acceleration}`,
        },
    }),
]);

// -----------------------------------------------------------------------------------------------------
// @ Fade out bottom
// -----------------------------------------------------------------------------------------------------
const fadeOutBottom = trigger('fadeOutBottom', [
    state(
        '*',
        style({
            opacity: 1,
            transform: 'translate3d(0, 0, 0)',
        })
    ),

    state(
        'void',
        style({
            opacity: 0,
            transform: 'translate3d(0, 100%, 0)',
        })
    ),

    // Prevent the transition if the state is false
    transition('false => void', []),

    // Transition
    transition('* => void', animate('{{timings}}'), {
        params: {
            timings: `${HelperAnimationDurations.exiting} ${HelperAnimationCurves.acceleration}`,
        },
    }),
]);

// -----------------------------------------------------------------------------------------------------
// @ Fade out left
// -----------------------------------------------------------------------------------------------------
const fadeOutLeft = trigger('fadeOutLeft', [
    state(
        '*',
        style({
            opacity: 1,
            transform: 'translate3d(0, 0, 0)',
        })
    ),

    state(
        'void',
        style({
            opacity: 0,
            transform: 'translate3d(-100%, 0, 0)',
        })
    ),

    // Prevent the transition if the state is false
    transition('false => void', []),

    // Transition
    transition('* => void', animate('{{timings}}'), {
        params: {
            timings: `${HelperAnimationDurations.exiting} ${HelperAnimationCurves.acceleration}`,
        },
    }),
]);

// -----------------------------------------------------------------------------------------------------
// @ Fade out right
// -----------------------------------------------------------------------------------------------------
const fadeOutRight = trigger('fadeOutRight', [
    state(
        '*',
        style({
            opacity: 1,
            transform: 'translate3d(0, 0, 0)',
        })
    ),

    state(
        'void',
        style({
            opacity: 0,
            transform: 'translate3d(100%, 0, 0)',
        })
    ),

    // Prevent the transition if the state is false
    transition('false => void', []),

    // Transition
    transition('* => void', animate('{{timings}}'), {
        params: {
            timings: `${HelperAnimationDurations.exiting} ${HelperAnimationCurves.acceleration}`,
        },
    }),
]);

export {
    fadeIn,
    fadeInCustom,
    fadeInBottom,
    fadeInLeft,
    fadeInRight,
    fadeInTop,
    fadeOut,
    fadeOutBottom,
    fadeOutLeft,
    fadeOutRight,
    fadeOutTop,
};
