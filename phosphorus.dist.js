"use strict";
/*!
Forkphorus: A JavaScript compiler for Scratch 2 and 3 projects.
(A fork of phosphorus)

Note: phosphorus.dist.js is automatically generated from the `phosphorus` folder.
See the README for more information.

The MIT License (MIT)

Copyright (c) 2013-2017 Nathan Dinsmore
Copyright (c) 2019 Thomas Weber

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
if (!('Promise' in window)) {
    throw new Error('Browser does not support Promise');
}
/// <reference path="phosphorus.ts" />
var P;
(function (P) {
    var config;
    (function (config) {
        const features = location.search.replace('?', '').split('&');
        config.debug = features.indexOf('debug') > -1;
        config.useWebGL = features.indexOf('webgl') > -1;
        config.preciseTimers = features.indexOf('preciseTimers') > -1;
        config.useCrashMonitor = features.indexOf('crashmonitor') > -1;
        config.scale = window.devicePixelRatio || 1;
        config.hasTouchEvents = 'ontouchstart' in document;
        config.PROJECT_API = 'https://projects.scratch.mit.edu/$id';
    })(config = P.config || (P.config = {}));
})(P || (P = {}));
/// <reference path="phosphorus.ts" />
/// <reference path="config.ts" />
var P;
(function (P) {
    var audio;
    (function (audio) {
        // Create an audio context involves a little bit of logic, so an IIFE is used.
        audio.context = (function () {
            if (window.AudioContext) {
                return new AudioContext();
            }
            else if (window.webkitAudioContext) {
                return new window.webkitAudioContext();
            }
            else {
                return null;
            }
        })();
        if (audio.context) {
            // TODO: customizable volume
            var volume = 0.3;
            var globalNode = audio.context.createGain();
            globalNode.gain.value = volume;
            globalNode.connect(audio.context.destination);
        }
        /*
          copy(JSON.stringify(drums.map(function(d) {
            var decayTime = d[4] || 0;
            var baseRatio = Math.pow(2, (60 - d[1] - 69) / 12);
            if (d[2]) {
              var length = d[3] - d[2];
              baseRatio = 22050 * Math.round(length * 440 * baseRatio / 22050) / length / 440;
            }
            return {
              name: d[0],
              baseRatio: baseRatio,
              loop: !!d[2],
              loopStart: d[2] / 22050,
              loopEnd: d[3] / 22050,
              attackEnd: 0,
              holdEnd: 0,
              decayEnd: decayTime
            }
          }))
        */
        audio.drums = [
            { name: 'SnareDrum', baseRatio: 0.5946035575013605, loop: false, loopStart: null, loopEnd: null, attackEnd: 0, holdEnd: 0, decayEnd: 0 },
            { name: 'Tom', baseRatio: 0.5946035575013605, loop: false, loopStart: null, loopEnd: null, attackEnd: 0, holdEnd: 0, decayEnd: 0 },
            { name: 'SideStick', baseRatio: 0.5946035575013605, loop: false, loopStart: null, loopEnd: null, attackEnd: 0, holdEnd: 0, decayEnd: 0 },
            { name: 'Crash', baseRatio: 0.8908987181403393, loop: false, loopStart: null, loopEnd: null, attackEnd: 0, holdEnd: 0, decayEnd: 0 },
            { name: 'HiHatOpen', baseRatio: 0.9438743126816935, loop: false, loopStart: null, loopEnd: null, attackEnd: 0, holdEnd: 0, decayEnd: 0 },
            { name: 'HiHatClosed', baseRatio: 0.5946035575013605, loop: false, loopStart: null, loopEnd: null, attackEnd: 0, holdEnd: 0, decayEnd: 0 },
            { name: 'Tambourine', baseRatio: 0.5946035575013605, loop: false, loopStart: null, loopEnd: null, attackEnd: 0, holdEnd: 0, decayEnd: 0 },
            { name: 'Clap', baseRatio: 0.5946035575013605, loop: false, loopStart: null, loopEnd: null, attackEnd: 0, holdEnd: 0, decayEnd: 0 },
            { name: 'Claves', baseRatio: 0.5946035575013605, loop: false, loopStart: null, loopEnd: null, attackEnd: 0, holdEnd: 0, decayEnd: 0 },
            { name: 'WoodBlock', baseRatio: 0.7491535384383408, loop: false, loopStart: null, loopEnd: null, attackEnd: 0, holdEnd: 0, decayEnd: 0 },
            { name: 'Cowbell', baseRatio: 0.5946035575013605, loop: false, loopStart: null, loopEnd: null, attackEnd: 0, holdEnd: 0, decayEnd: 0 },
            { name: 'Triangle', baseRatio: 0.8514452780229479, loop: true, loopStart: 0.7638548752834468, loopEnd: 0.7825396825396825, attackEnd: 0, holdEnd: 0, decayEnd: 2 },
            { name: 'Bongo', baseRatio: 0.5297315471796477, loop: false, loopStart: null, loopEnd: null, attackEnd: 0, holdEnd: 0, decayEnd: 0 },
            { name: 'Conga', baseRatio: 0.7954545454545454, loop: true, loopStart: 0.1926077097505669, loopEnd: 0.20403628117913833, attackEnd: 0, holdEnd: 0, decayEnd: 2 },
            { name: 'Cabasa', baseRatio: 0.5946035575013605, loop: false, loopStart: null, loopEnd: null, attackEnd: 0, holdEnd: 0, decayEnd: 0 },
            { name: 'GuiroLong', baseRatio: 0.5946035575013605, loop: false, loopStart: null, loopEnd: null, attackEnd: 0, holdEnd: 0, decayEnd: 0 },
            { name: 'Vibraslap', baseRatio: 0.8408964152537145, loop: false, loopStart: null, loopEnd: null, attackEnd: 0, holdEnd: 0, decayEnd: 0 },
            { name: 'Cuica', baseRatio: 0.7937005259840998, loop: false, loopStart: null, loopEnd: null, attackEnd: 0, holdEnd: 0, decayEnd: 0 }
        ];
        /*
          copy(JSON.stringify(instruments.map(function(g) {
            return g.map(function(r) {
              var attackTime = r[5] ? r[5][0] * 0.001 : 0;
              var holdTime = r[5] ? r[5][1] * 0.001 : 0;
              var decayTime = r[5] ? r[5][2] : 0;
              var baseRatio = Math.pow(2, (r[2] - 69) / 12);
              if (r[3] !== -1) {
                var length = r[4] - r[3];
                baseRatio = 22050 * Math.round(length * 440 * baseRatio / 22050) / length / 440;
              }
              return {
                top: r[0],
                name: r[1],
                baseRatio: baseRatio,
                loop: r[3] !== -1,
                loopStart: r[3] / 22050,
                loopEnd: r[4] / 22050,
                attackEnd: attackTime,
                holdEnd: attackTime + holdTime,
                decayEnd: attackTime + holdTime + decayTime
              }
            })
          }))
        */
        audio.instruments = [
            [
                { top: 38, name: 'AcousticPiano_As3', baseRatio: 0.5316313272700484, loop: true, loopStart: 0.465578231292517, loopEnd: 0.7733786848072562, attackEnd: 0, holdEnd: 0.1, decayEnd: 22.1 },
                { top: 44, name: 'AcousticPiano_C4', baseRatio: 0.5905141892259927, loop: true, loopStart: 0.6334693877551021, loopEnd: 0.8605442176870748, attackEnd: 0, holdEnd: 0.1, decayEnd: 20.1 },
                { top: 51, name: 'AcousticPiano_G4', baseRatio: 0.8843582887700535, loop: true, loopStart: 0.5532879818594104, loopEnd: 0.5609977324263039, attackEnd: 0, holdEnd: 0.08, decayEnd: 18.08 },
                { top: 62, name: 'AcousticPiano_C6', baseRatio: 2.3557692307692304, loop: true, loopStart: 0.5914739229024943, loopEnd: 0.6020861678004535, attackEnd: 0, holdEnd: 0.08, decayEnd: 16.08 },
                { top: 70, name: 'AcousticPiano_F5', baseRatio: 1.5776515151515151, loop: true, loopStart: 0.5634920634920635, loopEnd: 0.5879818594104308, attackEnd: 0, holdEnd: 0.04, decayEnd: 14.04 },
                { top: 77, name: 'AcousticPiano_Ds6', baseRatio: 2.800762112139358, loop: true, loopStart: 0.560907029478458, loopEnd: 0.5836281179138322, attackEnd: 0, holdEnd: 0.02, decayEnd: 10.02 },
                { top: 85, name: 'AcousticPiano_Ds6', baseRatio: 2.800762112139358, loop: true, loopStart: 0.560907029478458, loopEnd: 0.5836281179138322, attackEnd: 0, holdEnd: 0, decayEnd: 8 },
                { top: 90, name: 'AcousticPiano_Ds6', baseRatio: 2.800762112139358, loop: true, loopStart: 0.560907029478458, loopEnd: 0.5836281179138322, attackEnd: 0, holdEnd: 0, decayEnd: 6 },
                { top: 96, name: 'AcousticPiano_D7', baseRatio: 5.275119617224881, loop: true, loopStart: 0.3380498866213152, loopEnd: 0.34494331065759637, attackEnd: 0, holdEnd: 0, decayEnd: 3 },
                { top: 128, name: 'AcousticPiano_D7', baseRatio: 5.275119617224881, loop: true, loopStart: 0.3380498866213152, loopEnd: 0.34494331065759637, attackEnd: 0, holdEnd: 0, decayEnd: 2 }
            ], [
                { top: 48, name: 'ElectricPiano_C2', baseRatio: 0.14870515241435123, loop: true, loopStart: 0.6956009070294784, loopEnd: 0.7873015873015873, attackEnd: 0, holdEnd: 0.08, decayEnd: 10.08 },
                { top: 74, name: 'ElectricPiano_C4', baseRatio: 0.5945685670261941, loop: true, loopStart: 0.5181859410430839, loopEnd: 0.5449433106575964, attackEnd: 0, holdEnd: 0.04, decayEnd: 8.04 },
                { top: 128, name: 'ElectricPiano_C4', baseRatio: 0.5945685670261941, loop: true, loopStart: 0.5181859410430839, loopEnd: 0.5449433106575964, attackEnd: 0, holdEnd: 0, decayEnd: 6 }
            ], [
                { top: 128, name: 'Organ_G2', baseRatio: 0.22283731584620914, loop: true, loopStart: 0.05922902494331066, loopEnd: 0.1510204081632653, attackEnd: 0, holdEnd: 0, decayEnd: 0 }
            ], [{ top: 40, name: 'AcousticGuitar_F3', baseRatio: 0.3977272727272727, loop: true, loopStart: 1.6628117913832199, loopEnd: 1.6685260770975057, attackEnd: 0, holdEnd: 0, decayEnd: 15 },
                { top: 56, name: 'AcousticGuitar_F3', baseRatio: 0.3977272727272727, loop: true, loopStart: 1.6628117913832199, loopEnd: 1.6685260770975057, attackEnd: 0, holdEnd: 0, decayEnd: 13.5 },
                { top: 60, name: 'AcousticGuitar_F3', baseRatio: 0.3977272727272727, loop: true, loopStart: 1.6628117913832199, loopEnd: 1.6685260770975057, attackEnd: 0, holdEnd: 0, decayEnd: 12 },
                { top: 67, name: 'AcousticGuitar_F3', baseRatio: 0.3977272727272727, loop: true, loopStart: 1.6628117913832199, loopEnd: 1.6685260770975057, attackEnd: 0, holdEnd: 0, decayEnd: 8.5 },
                { top: 72, name: 'AcousticGuitar_F3', baseRatio: 0.3977272727272727, loop: true, loopStart: 1.6628117913832199, loopEnd: 1.6685260770975057, attackEnd: 0, holdEnd: 0, decayEnd: 7 },
                { top: 83, name: 'AcousticGuitar_F3', baseRatio: 0.3977272727272727, loop: true, loopStart: 1.6628117913832199, loopEnd: 1.6685260770975057, attackEnd: 0, holdEnd: 0, decayEnd: 5.5 },
                { top: 128, name: 'AcousticGuitar_F3', baseRatio: 0.3977272727272727, loop: true, loopStart: 1.6628117913832199, loopEnd: 1.6685260770975057, attackEnd: 0, holdEnd: 0, decayEnd: 4.5 }
            ], [
                { top: 40, name: 'ElectricGuitar_F3', baseRatio: 0.39615522817103843, loop: true, loopStart: 1.5733333333333333, loopEnd: 1.5848072562358, attackEnd: 0, holdEnd: 0, decayEnd: 15 },
                { top: 56, name: 'ElectricGuitar_F3', baseRatio: 0.39615522817103843, loop: true, loopStart: 1.5733333333333333, loopEnd: 1.5848072562358277, attackEnd: 0, holdEnd: 0, decayEnd: 13.5 },
                { top: 60, name: 'ElectricGuitar_F3', baseRatio: 0.39615522817103843, loop: true, loopStart: 1.5733333333333333, loopEnd: 1.5848072562358277, attackEnd: 0, holdEnd: 0, decayEnd: 12 },
                { top: 67, name: 'ElectricGuitar_F3', baseRatio: 0.39615522817103843, loop: true, loopStart: 1.5733333333333333, loopEnd: 1.5848072562358277, attackEnd: 0, holdEnd: 0, decayEnd: 8.5 },
                { top: 72, name: 'ElectricGuitar_F3', baseRatio: 0.39615522817103843, loop: true, loopStart: 1.5733333333333333, loopEnd: 1.5848072562358277, attackEnd: 0, holdEnd: 0, decayEnd: 7 },
                { top: 83, name: 'ElectricGuitar_F3', baseRatio: 0.39615522817103843, loop: true, loopStart: 1.5733333333333333, loopEnd: 1.5848072562358277, attackEnd: 0, holdEnd: 0, decayEnd: 5.5 },
                { top: 128, name: 'ElectricGuitar_F3', baseRatio: 0.39615522817103843, loop: true, loopStart: 1.5733333333333333, loopEnd: 1.5848072562358277, attackEnd: 0, holdEnd: 0, decayEnd: 4.5 }
            ], [
                { top: 34, name: 'ElectricBass_G1', baseRatio: 0.11111671034065712, loop: true, loopStart: 1.9007709750566892, loopEnd: 1.9212244897959183, attackEnd: 0, holdEnd: 0, decayEnd: 17 },
                { top: 48, name: 'ElectricBass_G1', baseRatio: 0.11111671034065712, loop: true, loopStart: 1.9007709750566892, loopEnd: 1.9212244897959183, attackEnd: 0, holdEnd: 0, decayEnd: 14 },
                { top: 64, name: 'ElectricBass_G1', baseRatio: 0.11111671034065712, loop: true, loopStart: 1.9007709750566892, loopEnd: 1.9212244897959183, attackEnd: 0, holdEnd: 0, decayEnd: 12 },
                { top: 128, name: 'ElectricBass_G1', baseRatio: 0.11111671034065712, loop: true, loopStart: 1.9007709750566892, loopEnd: 1.9212244897959183, attackEnd: 0, holdEnd: 0, decayEnd: 10 }
            ], [
                { top: 38, name: 'Pizz_G2', baseRatio: 0.21979665071770335, loop: true, loopStart: 0.3879365079365079, loopEnd: 0.3982766439909297, attackEnd: 0, holdEnd: 0, decayEnd: 5 },
                { top: 45, name: 'Pizz_G2', baseRatio: 0.21979665071770335, loop: true, loopStart: 0.3879365079365079, loopEnd: 0.3982766439909297, attackEnd: 0, holdEnd: 0.012, decayEnd: 4.012 },
                { top: 56, name: 'Pizz_A3', baseRatio: 0.503654636820466, loop: true, loopStart: 0.5197278911564626, loopEnd: 0.5287528344671202, attackEnd: 0, holdEnd: 0, decayEnd: 4 },
                { top: 64, name: 'Pizz_A3', baseRatio: 0.503654636820466, loop: true, loopStart: 0.5197278911564626, loopEnd: 0.5287528344671202, attackEnd: 0, holdEnd: 0, decayEnd: 3.2 },
                { top: 72, name: 'Pizz_E4', baseRatio: 0.7479647218453188, loop: true, loopStart: 0.7947845804988662, loopEnd: 0.7978231292517007, attackEnd: 0, holdEnd: 0, decayEnd: 2.8 },
                { top: 80, name: 'Pizz_E4', baseRatio: 0.7479647218453188, loop: true, loopStart: 0.7947845804988662, loopEnd: 0.7978231292517007, attackEnd: 0, holdEnd: 0, decayEnd: 2.2 },
                { top: 128, name: 'Pizz_E4', baseRatio: 0.7479647218453188, loop: true, loopStart: 0.7947845804988662, loopEnd: 0.7978231292517007, attackEnd: 0, holdEnd: 0, decayEnd: 1.5 }
            ], [
                { top: 41, name: 'Cello_C2', baseRatio: 0.14870515241435123, loop: true, loopStart: 0.3876643990929705, loopEnd: 0.40294784580498866, attackEnd: 0, holdEnd: 0, decayEnd: 0 },
                { top: 52, name: 'Cello_As2', baseRatio: 0.263755980861244, loop: true, loopStart: 0.3385487528344671, loopEnd: 0.35578231292517004, attackEnd: 0, holdEnd: 0, decayEnd: 0 },
                { top: 62, name: 'Violin_D4', baseRatio: 0.6664047388781432, loop: true, loopStart: 0.48108843537414964, loopEnd: 0.5151927437641723, attackEnd: 0, holdEnd: 0, decayEnd: 0 },
                { top: 75, name: 'Violin_A4', baseRatio: 0.987460815047022, loop: true, loopStart: 0.14108843537414967, loopEnd: 0.15029478458049886, attackEnd: 0.07, holdEnd: 0.07, decayEnd: 0.07 },
                { top: 128, name: 'Violin_E5', baseRatio: 1.4885238523852387, loop: true, loopStart: 0.10807256235827664, loopEnd: 0.1126530612244898, attackEnd: 0, holdEnd: 0, decayEnd: 0 }
            ], [
                { top: 30, name: 'BassTrombone_A2_3', baseRatio: 0.24981872564125807, loop: true, loopStart: 0.061541950113378686, loopEnd: 0.10702947845804989, attackEnd: 0, holdEnd: 0, decayEnd: 0 },
                { top: 40, name: 'BassTrombone_A2_2', baseRatio: 0.24981872564125807, loop: true, loopStart: 0.08585034013605441, loopEnd: 0.13133786848072562, attackEnd: 0, holdEnd: 0, decayEnd: 0 },
                { top: 55, name: 'Trombone_B3', baseRatio: 0.5608240680183126, loop: true, loopStart: 0.12, loopEnd: 0.17673469387755103, attackEnd: 0, holdEnd: 0, decayEnd: 0 },
                { top: 88, name: 'Trombone_B3', baseRatio: 0.5608240680183126, loop: true, loopStart: 0.12, loopEnd: 0.17673469387755103, attackEnd: 0.05, holdEnd: 0.05, decayEnd: 0.05 },
                { top: 128, name: 'Trumpet_E5', baseRatio: 1.4959294436906376, loop: true, loopStart: 0.1307936507936508, loopEnd: 0.14294784580498865, attackEnd: 0, holdEnd: 0, decayEnd: 0 }
            ], [
                { top: 128, name: 'Clarinet_C4', baseRatio: 0.5940193965517241, loop: true, loopStart: 0.6594104308390023, loopEnd: 0.7014965986394558, attackEnd: 0, holdEnd: 0, decayEnd: 0 }
            ], [
                { top: 40, name: 'TenorSax_C3', baseRatio: 0.2971698113207547, loop: true, loopStart: 0.4053968253968254, loopEnd: 0.4895238095238095, attackEnd: 0, holdEnd: 0, decayEnd: 0 },
                { top: 50, name: 'TenorSax_C3', baseRatio: 0.2971698113207547, loop: true, loopStart: 0.4053968253968254, loopEnd: 0.4895238095238095, attackEnd: 0.02, holdEnd: 0.02, decayEnd: 0.02 },
                { top: 59, name: 'TenorSax_C3', baseRatio: 0.2971698113207547, loop: true, loopStart: 0.4053968253968254, loopEnd: 0.4895238095238095, attackEnd: 0.04, holdEnd: 0.04, decayEnd: 0.04 },
                { top: 67, name: 'AltoSax_A3', baseRatio: 0.49814747876378096, loop: true, loopStart: 0.3875736961451247, loopEnd: 0.4103854875283447, attackEnd: 0, holdEnd: 0, decayEnd: 0 },
                { top: 75, name: 'AltoSax_A3', baseRatio: 0.49814747876378096, loop: true, loopStart: 0.3875736961451247, loopEnd: 0.4103854875283447, attackEnd: 0.02, holdEnd: 0.02, decayEnd: 0.02 },
                { top: 80, name: 'AltoSax_A3', baseRatio: 0.49814747876378096, loop: true, loopStart: 0.3875736961451247, loopEnd: 0.4103854875283447, attackEnd: 0.02, holdEnd: 0.02, decayEnd: 0.02 },
                { top: 128, name: 'AltoSax_C6', baseRatio: 2.3782742681047764, loop: true, loopStart: 0.05705215419501134, loopEnd: 0.0838095238095238, attackEnd: 0, holdEnd: 0, decayEnd: 0 }
            ], [
                { top: 61, name: 'Flute_B5_2', baseRatio: 2.255113636363636, loop: true, loopStart: 0.08430839002267573, loopEnd: 0.10244897959183673, attackEnd: 0, holdEnd: 0, decayEnd: 0 },
                { top: 128, name: 'Flute_B5_1', baseRatio: 2.255113636363636, loop: true, loopStart: 0.10965986394557824, loopEnd: 0.12780045351473923, attackEnd: 0, holdEnd: 0, decayEnd: 0 }
            ], [
                { top: 128, name: 'WoodenFlute_C5', baseRatio: 1.1892952324548416, loop: true, loopStart: 0.5181859410430839, loopEnd: 0.7131065759637188, attackEnd: 0, holdEnd: 0, decayEnd: 0 }
            ], [
                { top: 57, name: 'Bassoon_C3', baseRatio: 0.29700969827586204, loop: true, loopStart: 0.11011337868480725, loopEnd: 0.19428571428571428, attackEnd: 0, holdEnd: 0, decayEnd: 0 },
                { top: 67, name: 'Bassoon_C3', baseRatio: 0.29700969827586204, loop: true, loopStart: 0.11011337868480725, loopEnd: 0.19428571428571428, attackEnd: 0.04, holdEnd: 0.04, decayEnd: 0.04 },
                { top: 76, name: 'Bassoon_C3', baseRatio: 0.29700969827586204, loop: true, loopStart: 0.11011337868480725, loopEnd: 0.19428571428571428, attackEnd: 0.08, holdEnd: 0.08, decayEnd: 0.08 },
                { top: 84, name: 'EnglishHorn_F3', baseRatio: 0.39601293103448276, loop: true, loopStart: 0.341859410430839, loopEnd: 0.4049886621315193, attackEnd: 0.04, holdEnd: 0.04, decayEnd: 0.04 },
                { top: 128, name: 'EnglishHorn_D4', baseRatio: 0.6699684005833739, loop: true, loopStart: 0.22027210884353743, loopEnd: 0.23723356009070296, attackEnd: 0, holdEnd: 0, decayEnd: 0 }
            ], [
                { top: 39, name: 'Choir_F3', baseRatio: 0.3968814788643197, loop: true, loopStart: 0.6352380952380953, loopEnd: 1.8721541950113378, attackEnd: 0, holdEnd: 0, decayEnd: 0 },
                { top: 50, name: 'Choir_F3', baseRatio: 0.3968814788643197, loop: true, loopStart: 0.6352380952380953, loopEnd: 1.8721541950113378, attackEnd: 0.04, holdEnd: 0.04, decayEnd: 0.04 },
                { top: 61, name: 'Choir_F3', baseRatio: 0.3968814788643197, loop: true, loopStart: 0.6352380952380953, loopEnd: 1.8721541950113378, attackEnd: 0.06, holdEnd: 0.06, decayEnd: 0.06 },
                { top: 72, name: 'Choir_F4', baseRatio: 0.7928898424161845, loop: true, loopStart: 0.7415419501133786, loopEnd: 2.1059410430839, attackEnd: 0, holdEnd: 0, decayEnd: 0 },
                { top: 128, name: 'Choir_F5', baseRatio: 1.5879576065654504, loop: true, loopStart: 0.836281179138322, loopEnd: 2.0585487528344673, attackEnd: 0, holdEnd: 0, decayEnd: 0 }
            ], [
                { top: 38, name: 'Vibraphone_C3', baseRatio: 0.29829545454545453, loop: true, loopStart: 0.2812698412698413, loopEnd: 0.28888888888888886, attackEnd: 0, holdEnd: 0.1, decayEnd: 8.1 },
                { top: 48, name: 'Vibraphone_C3', baseRatio: 0.29829545454545453, loop: true, loopStart: 0.2812698412698413, loopEnd: 0.28888888888888886, attackEnd: 0, holdEnd: 0.1, decayEnd: 7.6 },
                { top: 59, name: 'Vibraphone_C3', baseRatio: 0.29829545454545453, loop: true, loopStart: 0.2812698412698413, loopEnd: 0.28888888888888886, attackEnd: 0, holdEnd: 0.06, decayEnd: 7.06 },
                { top: 70, name: 'Vibraphone_C3', baseRatio: 0.29829545454545453, loop: true, loopStart: 0.2812698412698413, loopEnd: 0.28888888888888886, attackEnd: 0, holdEnd: 0.04, decayEnd: 6.04 },
                { top: 78, name: 'Vibraphone_C3', baseRatio: 0.29829545454545453, loop: true, loopStart: 0.2812698412698413, loopEnd: 0.28888888888888886, attackEnd: 0, holdEnd: 0.02, decayEnd: 5.02 },
                { top: 86, name: 'Vibraphone_C3', baseRatio: 0.29829545454545453, loop: true, loopStart: 0.2812698412698413, loopEnd: 0.28888888888888886, attackEnd: 0, holdEnd: 0, decayEnd: 4 },
                { top: 128, name: 'Vibraphone_C3', baseRatio: 0.29829545454545453, loop: true, loopStart: 0.2812698412698413, loopEnd: 0.28888888888888886, attackEnd: 0, holdEnd: 0, decayEnd: 3 }
            ], [
                { top: 128, name: 'MusicBox_C4', baseRatio: 0.5937634640241276, loop: true, loopStart: 0.6475283446712018, loopEnd: 0.6666666666666666, attackEnd: 0, holdEnd: 0, decayEnd: 2 }
            ], [
                { top: 128, name: 'SteelDrum_D5', baseRatio: 1.3660402567543959, loop: false, loopStart: -0.000045351473922902495, loopEnd: -0.000045351473922902495, attackEnd: 0, holdEnd: 0, decayEnd: 2 }
            ], [
                { top: 128, name: 'Marimba_C4', baseRatio: 0.5946035575013605, loop: false, loopStart: -0.000045351473922902495, loopEnd: -0.000045351473922902495, attackEnd: 0, holdEnd: 0, decayEnd: 0 }
            ], [
                { top: 80, name: 'SynthLead_C4', baseRatio: 0.5942328422565577, loop: true, loopStart: 0.006122448979591836, loopEnd: 0.06349206349206349, attackEnd: 0, holdEnd: 0, decayEnd: 0 },
                { top: 128, name: 'SynthLead_C6', baseRatio: 2.3760775862068964, loop: true, loopStart: 0.005623582766439909, loopEnd: 0.01614512471655329, attackEnd: 0, holdEnd: 0, decayEnd: 0 }
            ], [
                { top: 38, name: 'SynthPad_A3', baseRatio: 0.4999105065330231, loop: true, loopStart: 0.1910204081632653, loopEnd: 3.9917006802721087, attackEnd: 0.05, holdEnd: 0.05, decayEnd: 0.05 },
                { top: 50, name: 'SynthPad_A3', baseRatio: 0.4999105065330231, loop: true, loopStart: 0.1910204081632653, loopEnd: 3.9917006802721087, attackEnd: 0.08, holdEnd: 0.08, decayEnd: 0.08 },
                { top: 62, name: 'SynthPad_A3', baseRatio: 0.4999105065330231, loop: true, loopStart: 0.1910204081632653, loopEnd: 3.9917006802721087, attackEnd: 0.11, holdEnd: 0.11, decayEnd: 0.11 },
                { top: 74, name: 'SynthPad_A3', baseRatio: 0.4999105065330231, loop: true, loopStart: 0.1910204081632653, loopEnd: 3.9917006802721087, attackEnd: 0.15, holdEnd: 0.15, decayEnd: 0.15 },
                { top: 86, name: 'SynthPad_A3', baseRatio: 0.4999105065330231, loop: true, loopStart: 0.1910204081632653, loopEnd: 3.9917006802721087, attackEnd: 0.2, holdEnd: 0.2, decayEnd: 0.2 },
                { top: 128, name: 'SynthPad_C6', baseRatio: 2.3820424708835755, loop: true, loopStart: 0.11678004535147392, loopEnd: 0.41732426303854875, attackEnd: 0, holdEnd: 0, decayEnd: 0 }
            ]
        ];
        const SOUNDBANK_URL = '/soundbank/';
        const SOUNDBANK_FILES = {
            'AcousticGuitar_F3': 'instruments/AcousticGuitar_F3_22k.wav',
            'AcousticPiano_As3': 'instruments/AcousticPiano(5)_A%233_22k.wav',
            'AcousticPiano_C4': 'instruments/AcousticPiano(5)_C4_22k.wav',
            'AcousticPiano_G4': 'instruments/AcousticPiano(5)_G4_22k.wav',
            'AcousticPiano_F5': 'instruments/AcousticPiano(5)_F5_22k.wav',
            'AcousticPiano_C6': 'instruments/AcousticPiano(5)_C6_22k.wav',
            'AcousticPiano_Ds6': 'instruments/AcousticPiano(5)_D%236_22k.wav',
            'AcousticPiano_D7': 'instruments/AcousticPiano(5)_D7_22k.wav',
            'AltoSax_A3': 'instruments/AltoSax_A3_22K.wav',
            'AltoSax_C6': 'instruments/AltoSax(3)_C6_22k.wav',
            'Bassoon_C3': 'instruments/Bassoon_C3_22k.wav',
            'BassTrombone_A2_2': 'instruments/BassTrombone_A2(2)_22k.wav',
            'BassTrombone_A2_3': 'instruments/BassTrombone_A2(3)_22k.wav',
            'Cello_C2': 'instruments/Cello(3b)_C2_22k.wav',
            'Cello_As2': 'instruments/Cello(3)_A%232_22k.wav',
            'Choir_F3': 'instruments/Choir(4)_F3_22k.wav',
            'Choir_F4': 'instruments/Choir(4)_F4_22k.wav',
            'Choir_F5': 'instruments/Choir(4)_F5_22k.wav',
            'Clarinet_C4': 'instruments/Clarinet_C4_22k.wav',
            'ElectricBass_G1': 'instruments/ElectricBass(2)_G1_22k.wav',
            'ElectricGuitar_F3': 'instruments/ElectricGuitar(2)_F3(1)_22k.wav',
            'ElectricPiano_C2': 'instruments/ElectricPiano_C2_22k.wav',
            'ElectricPiano_C4': 'instruments/ElectricPiano_C4_22k.wav',
            'EnglishHorn_D4': 'instruments/EnglishHorn(1)_D4_22k.wav',
            'EnglishHorn_F3': 'instruments/EnglishHorn(1)_F3_22k.wav',
            'Flute_B5_1': 'instruments/Flute(3)_B5(1)_22k.wav',
            'Flute_B5_2': 'instruments/Flute(3)_B5(2)_22k.wav',
            'Marimba_C4': 'instruments/Marimba_C4_22k.wav',
            'MusicBox_C4': 'instruments/MusicBox_C4_22k.wav',
            'Organ_G2': 'instruments/Organ(2)_G2_22k.wav',
            'Pizz_A3': 'instruments/Pizz(2)_A3_22k.wav',
            'Pizz_E4': 'instruments/Pizz(2)_E4_22k.wav',
            'Pizz_G2': 'instruments/Pizz(2)_G2_22k.wav',
            'SteelDrum_D5': 'instruments/SteelDrum_D5_22k.wav',
            'SynthLead_C4': 'instruments/SynthLead(6)_C4_22k.wav',
            'SynthLead_C6': 'instruments/SynthLead(6)_C6_22k.wav',
            'SynthPad_A3': 'instruments/SynthPad(2)_A3_22k.wav',
            'SynthPad_C6': 'instruments/SynthPad(2)_C6_22k.wav',
            'TenorSax_C3': 'instruments/TenorSax(1)_C3_22k.wav',
            'Trombone_B3': 'instruments/Trombone_B3_22k.wav',
            'Trumpet_E5': 'instruments/Trumpet_E5_22k.wav',
            'Vibraphone_C3': 'instruments/Vibraphone_C3_22k.wav',
            'Violin_D4': 'instruments/Violin(2)_D4_22K.wav',
            'Violin_A4': 'instruments/Violin(3)_A4_22k.wav',
            'Violin_E5': 'instruments/Violin(3b)_E5_22k.wav',
            'WoodenFlute_C5': 'instruments/WoodenFlute_C5_22k.wav',
            'BassDrum': 'drums/BassDrum(1b)_22k.wav',
            'Bongo': 'drums/Bongo_22k.wav',
            'Cabasa': 'drums/Cabasa(1)_22k.wav',
            'Clap': 'drums/Clap(1)_22k.wav',
            'Claves': 'drums/Claves(1)_22k.wav',
            'Conga': 'drums/Conga(1)_22k.wav',
            'Cowbell': 'drums/Cowbell(3)_22k.wav',
            'Crash': 'drums/Crash(2)_22k.wav',
            'Cuica': 'drums/Cuica(2)_22k.wav',
            'GuiroLong': 'drums/GuiroLong(1)_22k.wav',
            'GuiroShort': 'drums/GuiroShort(1)_22k.wav',
            'HiHatClosed': 'drums/HiHatClosed(1)_22k.wav',
            'HiHatOpen': 'drums/HiHatOpen(2)_22k.wav',
            'HiHatPedal': 'drums/HiHatPedal(1)_22k.wav',
            'Maracas': 'drums/Maracas(1)_22k.wav',
            'SideStick': 'drums/SideStick(1)_22k.wav',
            'SnareDrum': 'drums/SnareDrum(1)_22k.wav',
            'Tambourine': 'drums/Tambourine(3)_22k.wav',
            'Tom': 'drums/Tom(1)_22k.wav',
            'Triangle': 'drums/Triangle(1)_22k.wav',
            'Vibraslap': 'drums/Vibraslap(1)_22k.wav',
            'WoodBlock': 'drums/WoodBlock(1)_22k.wav'
        };
        const soundbank = {};
        /**
         * Loads missing soundbank files, if any.
         */
        function loadSoundbank() {
            if (!audio.context)
                return Promise.resolve();
            const promises = [];
            for (const name in SOUNDBANK_FILES) {
                if (!soundbank[name]) {
                    promises.push(loadSoundbankBuffer(name));
                }
            }
            return Promise.all(promises);
        }
        audio.loadSoundbank = loadSoundbank;
        /**
         * Loads a soundbank file
         */
        function loadSoundbankBuffer(name) {
            return new P.IO.ArrayBufferRequest(SOUNDBANK_URL + SOUNDBANK_FILES[name], { local: true }).load()
                .then((buffer) => P.audio.decodeAudio(buffer))
                .then((sound) => soundbank[name] = sound);
        }
        function playSpan(span, key, duration, connection) {
            if (!audio.context) {
                return;
            }
            const buffer = soundbank[span.name];
            if (!buffer) {
                return;
            }
            const source = audio.context.createBufferSource();
            const note = audio.context.createGain();
            source.buffer = buffer;
            if (source.loop = span.loop) {
                source.loopStart = span.loopStart;
                source.loopEnd = span.loopEnd;
            }
            source.connect(note);
            note.connect(connection);
            const time = audio.context.currentTime;
            source.playbackRate.value = Math.pow(2, (key - 69) / 12) / span.baseRatio;
            const gain = note.gain;
            gain.value = 0;
            gain.setValueAtTime(0, time);
            if (span.attackEnd < duration) {
                gain.linearRampToValueAtTime(1, time + span.attackEnd);
                if (span.decayTime > 0 && span.holdEnd < duration) {
                    gain.linearRampToValueAtTime(1, time + span.holdEnd);
                    if (span.decayEnd < duration) {
                        gain.linearRampToValueAtTime(0, time + span.decayEnd);
                    }
                    else {
                        gain.linearRampToValueAtTime(1 - (duration - span.holdEnd) / span.decayTime, time + duration);
                    }
                }
                else {
                    gain.linearRampToValueAtTime(1, time + duration);
                }
            }
            else {
                gain.linearRampToValueAtTime(1, time + duration);
            }
            gain.linearRampToValueAtTime(0, time + duration + 0.02267573696);
            source.start(time);
            source.stop(time + duration + 0.02267573696);
        }
        audio.playSpan = playSpan;
        /**
         * Connect an audio node
         */
        function connectNode(node) {
            node.connect(globalNode);
        }
        audio.connectNode = connectNode;
        const ADPCM_STEPS = [
            7, 8, 9, 10, 11, 12, 13, 14, 16, 17,
            19, 21, 23, 25, 28, 31, 34, 37, 41, 45,
            50, 55, 60, 66, 73, 80, 88, 97, 107, 118,
            130, 143, 157, 173, 190, 209, 230, 253, 279, 307,
            337, 371, 408, 449, 494, 544, 598, 658, 724, 796,
            876, 963, 1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066,
            2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871, 5358,
            5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899,
            15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767,
        ];
        const ADPCM_INDEX = [-1, -1, -1, -1, 2, 4, 6, 8, -1, -1, -1, -1, 2, 4, 6, 8];
        function decodeADPCMAudio(ab, cb) {
            var dv = new DataView(ab);
            if (dv.getUint32(0) !== 0x52494646 || dv.getUint32(8) !== 0x57415645) {
                return cb(new Error('Unrecognized audio format'));
            }
            var blocks = {};
            var i = 12, l = dv.byteLength - 8;
            while (i < l) {
                blocks[String.fromCharCode(dv.getUint8(i), dv.getUint8(i + 1), dv.getUint8(i + 2), dv.getUint8(i + 3))] = i;
                i += 8 + dv.getUint32(i + 4, true);
            }
            var format = dv.getUint16(20, true);
            var channels = dv.getUint16(22, true);
            var sampleRate = dv.getUint32(24, true);
            var byteRate = dv.getUint32(28, true);
            var blockAlign = dv.getUint16(32, true);
            var bitsPerSample = dv.getUint16(34, true);
            if (format === 17) {
                var samplesPerBlock = dv.getUint16(38, true);
                var blockSize = ((samplesPerBlock - 1) / 2) + 4;
                var frameCount = dv.getUint32(blocks.fact + 8, true);
                var buffer = audio.context.createBuffer(1, frameCount, sampleRate);
                var channel = buffer.getChannelData(0);
                var sample, index = 0;
                var step, code, delta;
                var lastByte = -1;
                var offset = blocks.data + 8;
                i = offset;
                var j = 0;
                while (true) {
                    if ((((i - offset) % blockSize) == 0) && (lastByte < 0)) {
                        if (i >= dv.byteLength)
                            break;
                        sample = dv.getInt16(i, true);
                        i += 2;
                        index = dv.getUint8(i);
                        i += 1;
                        i++;
                        if (index > 88)
                            index = 88;
                        channel[j++] = sample / 32767;
                    }
                    else {
                        if (lastByte < 0) {
                            if (i >= dv.byteLength)
                                break;
                            lastByte = dv.getUint8(i);
                            i += 1;
                            code = lastByte & 0xf;
                        }
                        else {
                            code = (lastByte >> 4) & 0xf;
                            lastByte = -1;
                        }
                        step = ADPCM_STEPS[index];
                        delta = 0;
                        if (code & 4)
                            delta += step;
                        if (code & 2)
                            delta += step >> 1;
                        if (code & 1)
                            delta += step >> 2;
                        delta += step >> 3;
                        index += ADPCM_INDEX[code];
                        if (index > 88)
                            index = 88;
                        if (index < 0)
                            index = 0;
                        sample += (code & 8) ? -delta : delta;
                        if (sample > 32767)
                            sample = 32767;
                        if (sample < -32768)
                            sample = -32768;
                        channel[j++] = sample / 32768;
                    }
                }
                return cb(null, buffer);
            }
            cb(new Error('Unrecognized WAV format ' + format));
        }
        function decodeAudio(ab) {
            if (!audio.context) {
                return Promise.reject('No audio context');
            }
            // TODO: does not work for some audio file
            return new Promise((resolve, reject) => {
                decodeADPCMAudio(ab, function (err1, buffer) {
                    if (buffer) {
                        resolve(buffer);
                        return;
                    }
                    // Hope that the audio context will know what to do
                    audio.context.decodeAudioData(ab)
                        .then((buffer) => resolve(buffer))
                        .catch((err2) => reject(`Could not decode audio: ${err1} | ${err2}`));
                });
            });
        }
        audio.decodeAudio = decodeAudio;
    })(audio = P.audio || (P.audio = {}));
})(P || (P = {}));
/// <reference path="phosphorus.ts" />
var P;
(function (P) {
    var m3;
    (function (m3) {
        // Most of this is heavily based on:
        // https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html
        // Eventually I want to move this to the shader itself.
        /**
         * Multiplies two 3x3 matrices together
         * @param out The first matrix. The result will be stored here.
         * @param other The second matrix.
         */
        function multiply(out, other) {
            const a0 = out[0];
            const a1 = out[1];
            const a2 = out[2];
            const a3 = out[3];
            const a4 = out[4];
            const a5 = out[5];
            const a6 = out[6];
            const a7 = out[7];
            const a8 = out[8];
            const b0 = other[0];
            const b1 = other[1];
            const b2 = other[2];
            const b3 = other[3];
            const b4 = other[4];
            const b5 = other[5];
            const b6 = other[6];
            const b7 = other[7];
            const b8 = other[8];
            out[0] = b0 * a0 + b1 * a3 + b2 * a6;
            out[1] = b0 * a1 + b1 * a4 + b2 * a7;
            out[2] = b0 * a2 + b1 * a5 + b2 * a8;
            out[3] = b3 * a0 + b4 * a3 + b5 * a6;
            out[4] = b3 * a1 + b4 * a4 + b5 * a7;
            out[5] = b3 * a2 + b4 * a5 + b5 * a8;
            out[6] = b6 * a0 + b7 * a3 + b8 * a6;
            out[7] = b6 * a1 + b7 * a4 + b8 * a7;
            out[8] = b6 * a2 + b7 * a5 + b8 * a8;
        }
        m3.multiply = multiply;
        function translation(x, y) {
            return [
                1, 0, 0,
                0, 1, 0,
                x, y, 1,
            ];
        }
        m3.translation = translation;
        function rotation(degrees) {
            const radians = degrees * Math.PI / 180;
            const cos = Math.cos(radians);
            const sin = Math.sin(radians);
            return [
                cos, -sin, 0,
                sin, cos, 0,
                0, 0, 1,
            ];
        }
        m3.rotation = rotation;
        function scaling(x, y) {
            return [
                x, 0, 0,
                0, y, 0,
                0, 0, 1,
            ];
        }
        m3.scaling = scaling;
        function projection(width, height) {
            return [
                2 / width, 0, 0,
                0, -2 / height, 0,
                -1, 1, 1,
            ];
        }
        m3.projection = projection;
    })(m3 = P.m3 || (P.m3 = {}));
})(P || (P = {}));
/// <reference path="phosphorus.ts" />
/// <reference path="matrix.ts" />
var P;
(function (P) {
    var renderer;
    (function (renderer) {
        // HELPERS
        /**
         * Create an HTML canvas with any type of context.
         */
        function createCanvas() {
            const canvas = document.createElement('canvas');
            canvas.width = 480;
            canvas.height = 360;
            return canvas;
        }
        /**
         * Create an HTML canvas with a 2d context.
         * Throws an error if a context cannot be obtained.
         */
        function create2dCanvas() {
            const canvas = createCanvas();
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Cannot get 2d rendering context');
            }
            ctx.imageSmoothingEnabled = false;
            return { canvas, ctx };
        }
        /**
         * Determines if a Sprite's filters will change its shape.
         * @param filters The Sprite's filters
         */
        function filtersAffectShape(filters) {
            return filters.fisheye !== 0 ||
                filters.mosaic !== 0 ||
                filters.pixelate !== 0 ||
                filters.whirl !== 0;
        }
        // WEBGL
        // Used in the WebGL renderer for inverting sprites.
        const horizontalInvertMatrix = P.m3.scaling(-1, 1);
        class ShaderVariant {
            constructor(gl, program) {
                // When loaded we'll lookup all of our attributes and uniforms, and store
                // their locations locally.
                // WebGL can tell us how many there are, so we can do lookups.
                this.gl = gl;
                this.program = program;
                this.uniformLocations = {};
                this.attributeLocations = {};
                const activeUniforms = gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS);
                for (let index = 0; index < activeUniforms; index++) {
                    const info = gl.getActiveUniform(program, index);
                    if (!info) {
                        throw new Error('uniform at index ' + index + ' does not exist');
                    }
                    const name = info.name;
                    const location = gl.getUniformLocation(program, name);
                    if (!location) {
                        throw new Error('uniform named ' + name + ' does not exist');
                    }
                    this.uniformLocations[name] = location;
                }
                const activeAttributes = gl.getProgramParameter(program, this.gl.ACTIVE_ATTRIBUTES);
                for (let index = 0; index < activeAttributes; index++) {
                    const info = gl.getActiveAttrib(program, index);
                    if (!info) {
                        throw new Error('attribute at index ' + index + ' does not exist');
                    }
                    // Attribute index is location, I believe.
                    this.attributeLocations[info.name] = index;
                }
            }
            /**
             * Sets a uniform to a float
             * @param name The name of the uniform
             * @param value A float
             */
            uniform1f(name, value) {
                const location = this.getUniform(name);
                this.gl.uniform1f(location, value);
            }
            /**
             * Sets a uniform to a vec2
             * @param name The name of the uniform
             * @param a The first value
             * @param b The second value
             */
            uniform2f(name, a, b) {
                const location = this.getUniform(name);
                this.gl.uniform2f(location, a, b);
            }
            /**
             * Sets a uniform to a 3x3 matrix
             * @param name The name of the uniform
             * @param value The 3x3 matrix
             */
            uniformMatrix3(name, value) {
                const location = this.getUniform(name);
                this.gl.uniformMatrix3fv(location, false, value);
            }
            /**
             * Determines if this shader variant contains a uniform.
             * @param name The name of the uniform
             */
            hasUniform(name) {
                return this.uniformLocations.hasOwnProperty(name);
            }
            /**
             * Determines the location of a uniform, or errors if it does not exist.
             * @param name The name of the uniform
             */
            getUniform(name) {
                if (!this.hasUniform(name)) {
                    throw new Error('uniform of name ' + name + ' does not exist');
                }
                return this.uniformLocations[name];
            }
            /**
             * Binds a buffer to an attribute
             * @param name The name of the attribute
             * @param value The WebGL buffer to bind
             */
            attributeBuffer(name, value) {
                if (!this.hasAttribute(name)) {
                    throw new Error('attribute of name ' + name + ' does not exist');
                }
                const location = this.attributeLocations[name];
                this.gl.enableVertexAttribArray(location);
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, value);
                this.gl.vertexAttribPointer(location, 2, this.gl.FLOAT, false, 0, 0);
            }
            /**
             * Determines if this shader contains an attribute
             * @param name The name of the attribute
             */
            hasAttribute(name) {
                return this.attributeLocations.hasOwnProperty(name);
            }
            /**
             * Determines the location of an attribute, and errors if it does not exist.
             * @param name The name of the attribute
             */
            getAttribute(name) {
                if (!this.hasAttribute(name)) {
                    throw new Error('attribute of name ' + name + ' does not exist');
                }
                return this.attributeLocations[name];
            }
        }
        class WebGLSpriteRenderer {
            constructor() {
                this.canvas = createCanvas();
                const gl = this.canvas.getContext('webgl');
                if (!gl) {
                    throw new Error('cannot get webgl rendering context');
                }
                this.gl = gl;
                this.renderingShader = this.compileVariant([]);
                // Enable transparency blending.
                this.gl.enable(this.gl.BLEND);
                // TODO: investigate other blending modes
                this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
                // Create the quad buffer that we'll use for positioning and texture coordinates later.
                this.quadBuffer = this.gl.createBuffer();
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
                    0, 0,
                    0, 1,
                    1, 0,
                    1, 0,
                    0, 1,
                    1, 1,
                ]), this.gl.STATIC_DRAW);
            }
            /**
             * Compile a single shader
             * @param type The type of the shader. Use this.gl.VERTEX_SHADER or FRAGMENT_SHADER
             * @param source The string source of the shader.
             * @param definitions Flags to define in the shader source.
             */
            compileShader(type, source, definitions) {
                const addDefinition = (def) => {
                    source = '#define ' + def + '\n' + source;
                };
                if (definitions) {
                    for (const def of definitions) {
                        addDefinition(def);
                    }
                }
                const shader = this.gl.createShader(type);
                if (!shader) {
                    throw new Error('Cannot create shader');
                }
                this.gl.shaderSource(shader, source);
                this.gl.compileShader(shader);
                if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
                    const error = this.gl.getShaderInfoLog(shader);
                    this.gl.deleteShader(shader);
                    throw new Error('Shader compilation error: ' + error);
                }
                return shader;
            }
            /**
             * Compiles a vertex shader and fragment shader into a program.
             * @param vs Vertex shader source.
             * @param fs Fragment shader source.
             * @param definitions Things to define in the source of both shaders.
             */
            compileProgram(vs, fs, definitions) {
                const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vs, definitions);
                const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fs, definitions);
                const program = this.gl.createProgram();
                if (!program) {
                    throw new Error('Cannot create program');
                }
                this.gl.attachShader(program, vertexShader);
                this.gl.attachShader(program, fragmentShader);
                this.gl.linkProgram(program);
                if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
                    const error = this.gl.getProgramInfoLog(program);
                    this.gl.deleteProgram(program);
                    throw new Error('Program compilation error: ' + error);
                }
                return program;
            }
            /**
             * Compiles a variant of the default shader.
             * @param definitions Things to define in the shader
             */
            compileVariant(definitions) {
                const program = this.compileProgram(WebGLSpriteRenderer.vertexShader, WebGLSpriteRenderer.fragmentShader, definitions);
                return new ShaderVariant(this.gl, program);
            }
            /**
             * Creates a new texture without inserting data.
             * Texture will be bound to TEXTURE_2D, so you can texImage2D() on it
             * Mipmapping will be disabled to allow for any size texture.
             */
            createTexture() {
                const texture = this.gl.createTexture();
                if (!texture) {
                    throw new Error('Cannot create texture');
                }
                this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
                return texture;
            }
            /**
             * Converts a canvas to a WebGL texture
             * @param canvas The source canvas. Dimensions do not matter.
             */
            convertToTexture(canvas) {
                const texture = this.createTexture();
                this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, canvas);
                return texture;
            }
            /**
             * Creates a new framebuffer
             */
            createFramebuffer() {
                const frameBuffer = this.gl.createFramebuffer();
                if (!frameBuffer) {
                    throw new Error('cannot create frame buffer');
                }
                return frameBuffer;
            }
            reset(scale) {
                // Scale the actual canvas
                this.canvas.width = scale * P.config.scale * 480;
                this.canvas.height = scale * P.config.scale * 360;
                this.resetFramebuffer(scale);
            }
            /**
             * Resizes and resets the current framebuffer
             * @param scale Scale
             */
            resetFramebuffer(scale) {
                this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
                this.globalScaleMatrix = P.m3.scaling(scale, scale);
                // Clear the canvas
                this.gl.clearColor(0, 0, 0, 0);
                this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            }
            drawChild(child) {
                this._drawChild(child, this.renderingShader);
            }
            /**
             * Real implementation of drawChild()
             * Shader must be set before calling (allows for using a different shader)
             * @param child The child to draw
             */
            _drawChild(child, shader) {
                this.gl.useProgram(shader.program);
                // Create the texture if it doesn't already exist.
                // We'll create a texture only once for performance.
                const costume = child.costumes[child.currentCostumeIndex];
                if (!costume._glTexture) {
                    const texture = this.convertToTexture(costume.get(1));
                    costume._glTexture = texture;
                }
                this.gl.bindTexture(this.gl.TEXTURE_2D, costume._glTexture);
                shader.attributeBuffer('a_texcoord', this.quadBuffer);
                shader.attributeBuffer('a_position', this.quadBuffer);
                // TODO: do this in the shader if its possible/faster
                const matrix = P.m3.projection(this.canvas.width, this.canvas.height);
                P.m3.multiply(matrix, this.globalScaleMatrix);
                P.m3.multiply(matrix, P.m3.translation(240 + child.scratchX | 0, 180 - child.scratchY | 0));
                if (P.core.isSprite(child)) {
                    if (child.rotationStyle === 0 /* Normal */ && child.direction !== 90) {
                        P.m3.multiply(matrix, P.m3.rotation(90 - child.direction));
                    }
                    else if (child.rotationStyle === 1 /* LeftRight */ && child.direction < 0) {
                        P.m3.multiply(matrix, horizontalInvertMatrix);
                    }
                    if (child.scale !== 1) {
                        P.m3.multiply(matrix, P.m3.scaling(child.scale, child.scale));
                    }
                }
                if (costume.scale !== 1) {
                    P.m3.multiply(matrix, P.m3.scaling(costume.scale, costume.scale));
                }
                P.m3.multiply(matrix, P.m3.translation(-costume.rotationCenterX, -costume.rotationCenterY));
                P.m3.multiply(matrix, P.m3.scaling(costume.width, costume.height));
                shader.uniformMatrix3('u_matrix', matrix);
                // Effects
                if (shader.hasUniform('u_opacity')) {
                    shader.uniform1f('u_opacity', 1 - child.filters.ghost / 100);
                }
                if (shader.hasUniform('u_brightness')) {
                    shader.uniform1f('u_brightness', child.filters.brightness / 100);
                }
                if (shader.hasUniform('u_color')) {
                    shader.uniform1f('u_color', child.filters.color / 200);
                }
                if (shader.hasUniform('u_mosaic')) {
                    const mosaic = Math.round((Math.abs(child.filters.mosaic) + 10) / 10);
                    shader.uniform1f('u_mosaic', P.utils.clamp(mosaic, 1, 512));
                }
                if (shader.hasUniform('u_whirl')) {
                    shader.uniform1f('u_whirl', child.filters.whirl * Math.PI / -180);
                }
                if (shader.hasUniform('u_fisheye')) {
                    shader.uniform1f('u_fisheye', Math.max(0, (child.filters.fisheye + 100) / 100));
                }
                if (shader.hasUniform('u_pixelate')) {
                    shader.uniform1f('u_pixelate', Math.abs(child.filters.pixelate) / 10);
                }
                if (shader.hasUniform('u_size')) {
                    shader.uniform2f('u_size', costume.width, costume.height);
                }
                this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
            }
            drawLayer(canvas) {
                const shader = this.renderingShader;
                this.gl.useProgram(shader.program);
                const texture = this.convertToTexture(canvas);
                this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
                shader.attributeBuffer('a_texcoord', this.quadBuffer);
                shader.attributeBuffer('a_position', this.quadBuffer);
                const matrix = P.m3.projection(this.canvas.width, this.canvas.height);
                P.m3.multiply(matrix, this.globalScaleMatrix);
                shader.uniformMatrix3('u_matrix', matrix);
                shader.uniform1f('u_opacity', 1);
                // TODO: is it necessary to delete textures?
                this.gl.deleteTexture(texture);
            }
        }
        WebGLSpriteRenderer.vertexShader = `
    attribute vec2 a_position;
    attribute vec2 a_texcoord;

    uniform mat3 u_matrix;

    varying vec2 v_texcoord;

    void main() {
      gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
      v_texcoord = a_texcoord;
    }
    `;
        WebGLSpriteRenderer.fragmentShader = `
    precision mediump float;

    varying vec2 v_texcoord;

    uniform sampler2D u_texture;
    #ifndef ONLY_SHAPE_FILTERS
      uniform float u_brightness;
      uniform float u_color;
    #endif
    uniform float u_opacity;
    uniform float u_mosaic;
    uniform float u_whirl;
    uniform float u_fisheye;
    uniform float u_pixelate;
    uniform vec2 u_size;

    const float minimumAlpha = 1.0 / 250.0;
    const vec2 vecCenter = vec2(0.5, 0.5);

    // http://lolengine.net/blog/2013/07/27/rgb-to-hsv-in-glsl
    vec3 rgb2hsv(vec3 c) {
      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
      vec4 p = c.g < c.b ? vec4(c.bg, K.wz) : vec4(c.gb, K.xy);
      vec4 q = c.r < p.x ? vec4(p.xyw, c.r) : vec4(c.r, p.yzx);
      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }
    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
      // varyings cannot be modified
      vec2 texcoord = v_texcoord;

      // apply mosaic
      {
        texcoord = fract(u_mosaic * v_texcoord);
      }

      // apply pixelate
      if (u_pixelate != 0.0) {
        vec2 texelSize = u_size / u_pixelate;
        texcoord = (floor(texcoord * texelSize) + vecCenter) / texelSize;
      }

      // apply whirl
      {
        const float radius = 0.5;
        vec2 offset = texcoord - vecCenter;
        float offsetMagnitude = length(offset);
        float whirlFactor = max(1.0 - (offsetMagnitude / radius), 0.0);
        float whirlActual = u_whirl * whirlFactor * whirlFactor;
        float sinWhirl = sin(whirlActual);
        float cosWhirl = cos(whirlActual);
        mat2 rotationMatrix = mat2(
          cosWhirl, -sinWhirl,
          sinWhirl, cosWhirl
        );
        texcoord = rotationMatrix * offset + vecCenter;
      }

      // apply fisheye
      {
        vec2 vec = (texcoord - vecCenter) / vecCenter;
        float vecLength = length(vec);
        float r = pow(min(vecLength, 1.0), u_fisheye) * max(1.0, vecLength);
        vec2 unit = vec / vecLength;
        texcoord = vecCenter + r * unit * vecCenter;
      }

      vec4 color = texture2D(u_texture, texcoord);
      if (color.a < minimumAlpha) {
        discard;
      }

      // apply ghost effect
      color.a *= u_opacity;
      // handle premultiplied alpha
      color.rgb *= u_opacity;

      // apply brightness effect
      #ifndef ONLY_SHAPE_FILTERS
        color.rgb = clamp(color.rgb + vec3(u_brightness), 0.0, 1.0);
      #endif

      // The color effect is rather complicated. See:
      // https://github.com/LLK/scratch-render/blob/008dc5b15b30961301e6b9a08628a063b967a001/src/shaders/sprite.frag#L175-L189
      #ifndef ONLY_SHAPE_FILTERS
      if (u_color != 0.0) {
        vec3 hsv = rgb2hsv(color.rgb);
        // hsv.x = hue
        // hsv.y = saturation
        // hsv.z = value

        // scratch forces all colors to have some minimal amount saturation so there is a visual change
        const float minValue = 0.11 / 2.0;
        const float minSaturation = 0.09;
        if (hsv.z < minValue) hsv = vec3(0.0, 1.0, minValue);
        else if (hsv.y < minSaturation) hsv = vec3(0.0, minSaturation, hsv.z);

        hsv.x = mod(hsv.x + u_color, 1.0);
        if (hsv.x < 0.0) hsv.x += 1.0;
        color = vec4(hsv2rgb(hsv), color.a);  
      }
      #endif

      gl_FragColor = color;
    }
    `;
        renderer.WebGLSpriteRenderer = WebGLSpriteRenderer;
        class WebGLProjectRenderer extends WebGLSpriteRenderer {
            constructor(stage) {
                super();
                this.stage = stage;
                this.shaderOnlyShapeFilters = this.compileVariant(['ONLY_SHAPE_FILTERS']);
                this.fallbackRenderer = new ProjectRenderer2D(stage);
                this.penLayer = this.fallbackRenderer.penLayer;
                this.stageLayer = this.fallbackRenderer.stageLayer;
            }
            /**
             * Sets this renderer to render to a framebuffer.
             * Initializes, binds, attaches, and clears the texture and framebuffer.
             * Framebuffer must be reset later.
             * @param framebuffer The framebuffer
             * @param texture The texture
             */
            setRenderToFramebuffer(framebuffer, texture) {
                // setup framebuffer
                this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
                // setup texture
                this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
                this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 480, 360, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
                this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0);
                // fix viewport/clear
                // always use a scale of 1 for now
                this.resetFramebuffer(1);
            }
            /**
             * Sets this renderer to render to the canvas instead of a framebuffer
             */
            resetRenderFramebuffer() {
                this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
            }
            penLine(color, size, x, y, x2, y2) {
                this.fallbackRenderer.penLine(color, size, x, y, x2, y2);
            }
            penDot(color, size, x, y) {
                this.fallbackRenderer.penDot(color, size, x, y);
            }
            penStamp(sprite) {
                this.fallbackRenderer.penStamp(sprite);
            }
            penClear() {
                this.fallbackRenderer.penClear();
            }
            penResize(scale) {
                this.fallbackRenderer.penResize(scale);
            }
            updateStage(scale) {
                this.fallbackRenderer.updateStage(scale);
            }
            updateStageFilters() {
                this.fallbackRenderer.updateStageFilters();
            }
            spriteTouchesPoint(sprite, x, y) {
                // If filters will not change the shape of the sprite, it would be faster
                // to avoid going to the GPU
                if (!filtersAffectShape(sprite.filters)) {
                    return this.fallbackRenderer.spriteTouchesPoint(sprite, x, y);
                }
                const texture = this.createTexture();
                const framebuffer = this.createFramebuffer();
                this.setRenderToFramebuffer(framebuffer, texture);
                this._drawChild(sprite, this.shaderOnlyShapeFilters);
                // Allocate 4 bytes to store 1 RGBA pixel
                const result = new Uint8Array(4);
                // Coordinates are in pixels from the lower left corner
                // We only care about 1 pixel, the pixel at the mouse cursor.
                this.gl.readPixels(240 + x | 0, 180 + y | 0, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, result);
                this.resetRenderFramebuffer();
                // I don't know if it's necessary to delete these
                this.gl.deleteTexture(texture);
                this.gl.deleteFramebuffer(framebuffer);
                // Just look for a non-zero alpha channel
                return result[3] !== 0;
            }
            spritesIntersect(spriteA, otherSprites) {
                // Render the original Sprite into a buffer just once
                const baseResult = new Uint8Array(480 * 360 * 4);
                const baseTexture = this.createTexture();
                const baseBuffer = this.createFramebuffer();
                this.setRenderToFramebuffer(baseBuffer, baseTexture);
                this._drawChild(spriteA, this.shaderOnlyShapeFilters);
                this.gl.readPixels(0, 0, 480, 360, this.gl.RGBA, this.gl.UNSIGNED_BYTE, baseResult);
                // Setup the rendering for the other sprite just once for performance
                const otherResult = new Uint8Array(480 * 360 * 4);
                const textureB = this.createTexture();
                const framebufferB = this.createFramebuffer();
                this.setRenderToFramebuffer(framebufferB, textureB);
                for (var i = 0; i < otherSprites.length; i++) {
                    const otherSprite = otherSprites[i];
                    if (!otherSprite.visible)
                        continue;
                    // Does the rendering of the sprite
                    this._drawChild(otherSprite, this.shaderOnlyShapeFilters);
                    this.gl.readPixels(0, 0, 480, 360, this.gl.RGBA, this.gl.UNSIGNED_BYTE, otherResult);
                    const length = 480 * 360 * 4;
                    for (var i = 0; i < length; i += 4) {
                        if (baseResult[i + 3] && otherResult[i + 3]) {
                            this.resetRenderFramebuffer();
                            return true;
                        }
                    }
                }
                this.resetRenderFramebuffer();
                return false;
            }
            spriteTouchesColor(sprite, color) {
                return this.fallbackRenderer.spriteTouchesColor(sprite, color);
            }
            spriteColorTouchesColor(sprite, spriteColor, otherColor) {
                return this.spriteColorTouchesColor(sprite, spriteColor, otherColor);
            }
        }
        renderer.WebGLProjectRenderer = WebGLProjectRenderer;
        // 2D
        /**
         * Creates the CSS filter for a Filter object.
         * The filter is generally an estimation of the actual effect.
         * Includes brightness and color. (does not include ghost)
         */
        function getCSSFilter(filters) {
            let filter = '';
            if (filters.brightness) {
                filter += 'brightness(' + (100 + filters.brightness) + '%) ';
            }
            if (filters.color) {
                filter += 'hue-rotate(' + (filters.color / 200 * 360) + 'deg) ';
            }
            return filter;
        }
        class SpriteRenderer2D {
            constructor() {
                this.noEffects = false;
                const { canvas, ctx } = create2dCanvas();
                this.canvas = canvas;
                this.ctx = ctx;
            }
            reset(scale) {
                this._reset(this.ctx, scale);
            }
            drawImage(image, x, y) {
                this.ctx.drawImage(image, x, y);
            }
            drawChild(c) {
                this._drawChild(c, this.ctx);
            }
            drawLayer(canvas) {
                this.ctx.drawImage(canvas, 0, 0, 480, 360);
            }
            _reset(ctx, scale) {
                const effectiveScale = scale * P.config.scale;
                ctx.canvas.width = 480 * effectiveScale;
                ctx.canvas.height = 360 * effectiveScale;
                ctx.scale(effectiveScale, effectiveScale);
            }
            _drawChild(c, ctx) {
                const costume = c.costumes[c.currentCostumeIndex];
                if (!costume) {
                    return;
                }
                ctx.save();
                const globalScale = c.stage.zoom * P.config.scale;
                ctx.translate(((c.scratchX + 240) * globalScale | 0) / globalScale, ((180 - c.scratchY) * globalScale | 0) / globalScale);
                let objectScale = costume.scale;
                // Direction transforms are only applied to Sprites because Stages cannot be rotated.
                if (P.core.isSprite(c)) {
                    if (c.rotationStyle === 0 /* Normal */) {
                        ctx.rotate((c.direction - 90) * Math.PI / 180);
                    }
                    else if (c.rotationStyle === 1 /* LeftRight */ && c.direction < 0) {
                        ctx.scale(-1, 1);
                    }
                    objectScale *= c.scale;
                }
                if (!this.noEffects) {
                    ctx.globalAlpha = Math.max(0, Math.min(1, 1 - c.filters.ghost / 100));
                    const filter = getCSSFilter(c.filters);
                    // Only apply a filter when needed because of a Firefox performance bug
                    if (filter !== '') {
                        ctx.filter = filter;
                    }
                }
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(costume.get(objectScale), -costume.rotationCenterX * objectScale, -costume.rotationCenterY * objectScale, costume.width * objectScale, costume.height * objectScale);
                ctx.restore();
            }
        }
        renderer.SpriteRenderer2D = SpriteRenderer2D;
        // Renderers used for some features such as collision detection
        const workingRenderer = new SpriteRenderer2D();
        const workingRenderer2 = new SpriteRenderer2D();
        class ProjectRenderer2D extends SpriteRenderer2D {
            constructor(stage) {
                super();
                this.stage = stage;
                this.penLayerModified = false;
                this.penLayerTargetScale = 1;
                this.penLayerMaxScale = -1;
                const { ctx: stageContext, canvas: stageLayer } = create2dCanvas();
                this.stageContext = stageContext;
                this.stageLayer = stageLayer;
                const { ctx: penContext, canvas: penLayer } = create2dCanvas();
                this.penContext = penContext;
                this.penLayer = penLayer;
            }
            updateStage(scale) {
                this._reset(this.stageContext, scale);
                this.noEffects = true;
                this._drawChild(this.stage, this.stageContext);
                this.noEffects = false;
                this.updateStageFilters();
            }
            updateStageFilters() {
                const filter = getCSSFilter(this.stage.filters);
                // Only reapply a CSS filter if it has changed for performance.
                // Might not be necessary here.
                if (this.stageLayer.style.filter !== filter) {
                    this.stageLayer.style.filter = filter;
                }
                // cssFilter does not include ghost
                this.stageLayer.style.opacity = '' + Math.max(0, Math.min(1, 1 - this.stage.filters.ghost / 100));
            }
            penClear() {
                this.penLayerModified = false;
                if (this.penLayerTargetScale !== -1) {
                    this._reset(this.penContext, this.penLayerTargetScale);
                    this.penLayerTargetScale = -1;
                }
                this.penContext.clearRect(0, 0, 480, 360);
            }
            penResize(scale) {
                if (scale > this.penLayerMaxScale) {
                    // Immediately scale up
                    this.penLayerMaxScale = scale;
                    const cachedCanvas = document.createElement('canvas');
                    cachedCanvas.width = this.penLayer.width;
                    cachedCanvas.height = this.penLayer.height;
                    cachedCanvas.getContext('2d').drawImage(this.penLayer, 0, 0);
                    this._reset(this.penContext, scale);
                    this.penContext.drawImage(cachedCanvas, 0, 0, 480, 360);
                }
                else if (!this.penLayerModified) {
                    // Immediately scale down if no changes have been made
                    this._reset(this.penContext, scale);
                }
                else {
                    // Attempt again later
                    this.penLayerTargetScale = scale;
                }
            }
            penDot(color, size, x, y) {
                this.penLayerModified = true;
                this.penContext.fillStyle = color;
                this.penContext.beginPath();
                this.penContext.arc(240 + x, 180 - y, size / 2, 0, 2 * Math.PI, false);
                this.penContext.fill();
            }
            penLine(color, size, x1, y1, x2, y2) {
                this.penLayerModified = true;
                this.penContext.lineCap = 'round';
                if (size % 2 > .5 && size % 2 < 1.5) {
                    x1 -= .5;
                    y1 -= .5;
                    x2 -= .5;
                    y2 -= .5;
                }
                this.penContext.strokeStyle = color;
                this.penContext.lineWidth = size;
                this.penContext.beginPath();
                this.penContext.moveTo(240 + x1, 180 - y1);
                this.penContext.lineTo(240 + x2, 180 - y2);
                this.penContext.stroke();
            }
            penStamp(sprite) {
                this.penLayerModified = true;
                this._drawChild(sprite, this.penContext);
            }
            spriteTouchesPoint(sprite, x, y) {
                const costume = sprite.costumes[sprite.currentCostumeIndex];
                const bounds = sprite.rotatedBounds();
                if (x < bounds.left || y < bounds.bottom || x > bounds.right || y > bounds.top) {
                    return false;
                }
                var cx = (x - sprite.scratchX) / sprite.scale;
                var cy = (sprite.scratchY - y) / sprite.scale;
                if (sprite.rotationStyle === 0 /* Normal */ && sprite.direction !== 90) {
                    const d = (90 - sprite.direction) * Math.PI / 180;
                    const ox = cx;
                    const s = Math.sin(d), c = Math.cos(d);
                    cx = c * ox - s * cy;
                    cy = s * ox + c * cy;
                }
                else if (sprite.rotationStyle === 1 /* LeftRight */ && sprite.direction < 0) {
                    cx = -cx;
                }
                const positionX = Math.round(cx * costume.bitmapResolution + costume.rotationCenterX);
                const positionY = Math.round(cy * costume.bitmapResolution + costume.rotationCenterY);
                const data = costume.getContext().getImageData(positionX, positionY, 1, 1).data;
                return data[3] !== 0;
            }
            spritesIntersect(spriteA, otherSprites) {
                const mb = spriteA.rotatedBounds();
                for (var i = 0; i < otherSprites.length; i++) {
                    const spriteB = otherSprites[i];
                    if (!spriteB.visible)
                        continue;
                    const ob = spriteB.rotatedBounds();
                    if (mb.bottom >= ob.top || ob.bottom >= mb.top || mb.left >= ob.right || ob.left >= mb.right) {
                        continue;
                    }
                    const left = Math.max(mb.left, ob.left);
                    const top = Math.min(mb.top, ob.top);
                    const right = Math.min(mb.right, ob.right);
                    const bottom = Math.max(mb.bottom, ob.bottom);
                    const width = right - left;
                    const height = top - bottom;
                    // dimensions that are less than 1 or NaN will cause issues
                    if (width < 1 || height < 1 || width !== width || height !== height) {
                        continue;
                    }
                    workingRenderer.canvas.width = width;
                    workingRenderer.canvas.height = height;
                    workingRenderer.ctx.save();
                    workingRenderer.noEffects = true;
                    workingRenderer.ctx.translate(-(left + 240), -(180 - top));
                    workingRenderer.drawChild(spriteA);
                    workingRenderer.ctx.globalCompositeOperation = 'source-in';
                    workingRenderer.drawChild(spriteB);
                    workingRenderer.noEffects = false;
                    workingRenderer.ctx.restore();
                    const data = workingRenderer.ctx.getImageData(0, 0, width, height).data;
                    const length = data.length;
                    for (var j = 0; j < length; j += 4) {
                        // check for the opacity byte being a non-zero number
                        if (data[j + 3]) {
                            return true;
                        }
                    }
                }
                return false;
            }
            spriteTouchesColor(sprite, color) {
                const b = sprite.rotatedBounds();
                workingRenderer.canvas.width = b.right - b.left;
                workingRenderer.canvas.height = b.top - b.bottom;
                workingRenderer.ctx.save();
                workingRenderer.ctx.translate(-(240 + b.left), -(180 - b.top));
                sprite.stage.drawAll(workingRenderer, sprite);
                workingRenderer.ctx.globalCompositeOperation = 'destination-in';
                workingRenderer.drawChild(sprite);
                workingRenderer.ctx.restore();
                const data = workingRenderer.ctx.getImageData(0, 0, b.right - b.left, b.top - b.bottom).data;
                color = color & 0xffffff;
                const length = (b.right - b.left) * (b.top - b.bottom) * 4;
                for (var i = 0; i < length; i += 4) {
                    if ((data[i] << 16 | data[i + 1] << 8 | data[i + 2]) === color && data[i + 3]) {
                        return true;
                    }
                }
                return false;
            }
            spriteColorTouchesColor(sprite, spriteColor, otherColor) {
                var rb = sprite.rotatedBounds();
                workingRenderer.canvas.width = workingRenderer2.canvas.width = rb.right - rb.left;
                workingRenderer.canvas.height = workingRenderer2.canvas.height = rb.top - rb.bottom;
                workingRenderer.ctx.save();
                workingRenderer2.ctx.save();
                workingRenderer.ctx.translate(-(240 + rb.left), -(180 - rb.top));
                workingRenderer2.ctx.translate(-(240 + rb.left), -(180 - rb.top));
                sprite.stage.drawAll(workingRenderer, sprite);
                workingRenderer.drawChild(sprite);
                workingRenderer.ctx.restore();
                var dataA = workingRenderer.ctx.getImageData(0, 0, rb.right - rb.left, rb.top - rb.bottom).data;
                var dataB = workingRenderer.ctx.getImageData(0, 0, rb.right - rb.left, rb.top - rb.bottom).data;
                spriteColor = spriteColor & 0xffffff;
                otherColor = otherColor & 0xffffff;
                var length = dataA.length;
                for (var i = 0; i < length; i += 4) {
                    var touchesSource = (dataB[i] << 16 | dataB[i + 1] << 8 | dataB[i + 2]) === spriteColor && dataB[i + 3];
                    var touchesOther = (dataA[i] << 16 | dataA[i + 1] << 8 | dataA[i + 2]) === otherColor && dataA[i + 3];
                    if (touchesSource && touchesOther) {
                        return true;
                    }
                }
                return false;
            }
        }
        renderer.ProjectRenderer2D = ProjectRenderer2D;
    })(renderer = P.renderer || (P.renderer = {}));
})(P || (P = {}));
/// <reference path="phosphorus.ts" />
/// <reference path="config.ts" />
/// <reference path="renderer.ts" />
// Phosphorus base classes
// Implements most functionality while leaving some specifics to implementations (P.sb2, P.sb3)
var P;
(function (P) {
    var core;
    (function (core) {
        class Base {
            constructor() {
                /**
                 * Is this a stage?
                 */
                this.isStage = false;
                /**
                 * Is this a sprite?
                 */
                this.isSprite = false;
                /**
                 * Was this Sprite created as a clone of another?
                 */
                this.isClone = false;
                /**
                 * Is this object visible?
                 */
                this.visible = true;
                /**
                 * The sprite's X coordinate on the Scratch grid.
                 */
                this.scratchX = 0;
                /**
                 * The sprite's Y coordinate on the Scratch grid.
                 */
                this.scratchY = 0;
                /**
                 * The name of this object.
                 */
                this.name = '';
                /**
                 * Costumes that belong to this object.
                 */
                this.costumes = [];
                /**
                 * The index of the currently selected costume in its costume list.
                 */
                this.currentCostumeIndex = 0;
                /**
                 * Sounds that belong to this object.
                 */
                this.sounds = [];
                /**
                 * Maps the names of sounds to the corresponding Sound
                 */
                this.soundRefs = {};
                /**
                 * Currently selected instrument
                 */
                this.instrument = 0;
                /**
                 * The volume of this object, where 1.0 === 100% volume
                 */
                this.volume = 1;
                /**
                 * The audio node that this object outputs to.
                 */
                this.node = null;
                /**
                 * Maps names (or ids) of variables or lists to their Watcher, if any.
                 */
                this.watchers = {};
                /**
                 * Variables of this object.
                 * Maps variable names (or ids) to their value.
                 * Values can be of any type and should likely be converted first.
                 */
                this.vars = {};
                /**
                 * Lists of this object.
                 * Maps list names (or ids) to their list.
                 * Each list can contain objects of any type, and should be converted first.
                 */
                this.lists = {};
                /**
                 * Is this object saying something?
                 */
                this.saying = false;
                /**
                 * Should this object's speech bubble be a thinking bubble instead?
                 */
                this.thinking = false;
                /**
                 * The ID of the last thing said.
                 */
                this.sayId = 0;
                /**
                 * Maps procedure names (usually includes parameters) to the Procedure object
                 */
                this.procedures = {};
                this.listeners = {
                    whenClicked: [],
                    whenCloned: [],
                    whenGreenFlag: [],
                    whenIReceive: {},
                    whenKeyPressed: [],
                    whenBackdropChanges: {},
                    whenSceneStarts: [],
                };
                this.fns = [];
                this.filters = {
                    color: 0,
                    fisheye: 0,
                    whirl: 0,
                    pixelate: 0,
                    mosaic: 0,
                    brightness: 0,
                    ghost: 0,
                };
                for (var i = 0; i < 128; i++) {
                    this.listeners.whenKeyPressed.push([]);
                }
            }
            // Data/Loading methods
            addSound(sound) {
                this.soundRefs[sound.name] = sound;
                this.sounds.push(sound);
            }
            // Implementations of Scratch blocks
            showVariable(name, visible) {
                let watcher = this.watchers[name];
                // Create watchers that might not exist
                if (!watcher) {
                    const newWatcher = this.createVariableWatcher(this, name);
                    if (!newWatcher) {
                        return;
                    }
                    newWatcher.init();
                    this.watchers[name] = watcher = newWatcher;
                    this.stage.allWatchers.push(watcher);
                }
                watcher.setVisible(visible);
            }
            showNextCostume() {
                this.currentCostumeIndex = (this.currentCostumeIndex + 1) % this.costumes.length;
                if (this.saying && isSprite(this))
                    this.updateBubble();
            }
            showPreviousCostume() {
                var length = this.costumes.length;
                this.currentCostumeIndex = (this.currentCostumeIndex + length - 1) % length;
                if (this.saying && isSprite(this))
                    this.updateBubble();
            }
            getCostumeName() {
                return this.costumes[this.currentCostumeIndex] ? this.costumes[this.currentCostumeIndex].name : '';
            }
            setCostume(costume) {
                if (typeof costume !== 'number') {
                    costume = '' + costume;
                    for (var i = 0; i < this.costumes.length; i++) {
                        if (this.costumes[i].name === costume) {
                            this.currentCostumeIndex = i;
                            if (this.saying && isSprite(this))
                                this.updateBubble();
                            return;
                        }
                    }
                    if (costume === (this.isSprite ? 'next costume' : 'next backdrop')) {
                        this.showNextCostume();
                        return;
                    }
                    if (costume === (this.isSprite ? 'previous costume' : 'previous backdrop')) {
                        this.showPreviousCostume();
                        return;
                    }
                    if (!isFinite(costume)) {
                        return;
                    }
                }
                var i = (Math.floor(costume) - 1 || 0) % this.costumes.length;
                if (i < 0)
                    i += this.costumes.length;
                this.currentCostumeIndex = i;
                if (isSprite(this) && this.saying)
                    this.updateBubble();
            }
            setFilter(name, value) {
                switch (name) {
                    case 'ghost':
                        if (value < 0)
                            value = 0;
                        if (value > 100)
                            value = 100;
                        break;
                    case 'brightness':
                        if (value < -100)
                            value = -100;
                        if (value > 100)
                            value = 100;
                        break;
                    case 'color':
                        value = value % 200;
                        if (value < 0)
                            value += 200;
                        break;
                }
                this.filters[name] = value;
            }
            changeFilter(name, value) {
                this.setFilter(name, this.filters[name] + value);
            }
            resetFilters() {
                this.filters = {
                    color: 0,
                    fisheye: 0,
                    whirl: 0,
                    pixelate: 0,
                    mosaic: 0,
                    brightness: 0,
                    ghost: 0
                };
            }
            getSound(name) {
                if (typeof name === 'string') {
                    var s = this.soundRefs[name];
                    if (s)
                        return s;
                    name = +name;
                }
                var l = this.sounds.length;
                if (l && typeof name === 'number' && name === name) {
                    var i = Math.round(name - 1) % l;
                    if (i < 0)
                        i += l;
                    return this.sounds[i];
                }
            }
            /**
             * Stops all sounds in this object.
             */
            stopSounds() {
                if (this.node) {
                    this.node.disconnect();
                    this.node = null;
                }
            }
            ask(question) {
                var stage = this.stage;
                if (question) {
                    if (this.visible && isSprite(this)) {
                        this.say(question);
                        stage.promptTitle.style.display = 'none';
                    }
                    else {
                        stage.promptTitle.style.display = 'block';
                        stage.promptTitle.textContent = question;
                    }
                }
                else {
                    stage.promptTitle.style.display = 'none';
                }
                stage.hidePrompt = false;
                stage.prompter.style.display = 'block';
                stage.prompt.value = '';
                stage.prompt.focus();
            }
            /**
             * Makes this object say some text.
             * @param text The text to say
             * @param thinking If the text box should be in the thinking style or just speaking
             * @returns A unique ID for this bubble
             */
            say(text, thinking = false) {
                text = text.toString();
                // Empty strings disable saying anything.
                if (text.length === 0) {
                    this.saying = false;
                    if (this.bubbleContainer)
                        this.bubbleContainer.style.display = 'none';
                    return ++this.sayId;
                }
                this.saying = true;
                this.thinking = thinking;
                if (!this.bubbleContainer) {
                    this.bubbleContainer = document.createElement('div');
                    this.bubbleContainer.style.maxWidth = (127 / 14) + 'em';
                    this.bubbleContainer.style.minWidth = (48 / 14) + 'em';
                    this.bubbleContainer.style.padding = (8 / 14) + 'em ' + (10 / 14) + 'em';
                    this.bubbleContainer.style.border = (3 / 14) + 'em solid rgb(160, 160, 160)';
                    this.bubbleContainer.style.borderRadius = (10 / 14) + 'em';
                    this.bubbleContainer.style.background = '#fff';
                    this.bubbleContainer.style.position = 'absolute';
                    this.bubbleContainer.style.font = 'bold 1.4em sans-serif';
                    this.bubbleContainer.style.whiteSpace = 'pre-wrap';
                    this.bubbleContainer.style.wordWrap = 'break-word';
                    this.bubbleContainer.style.textAlign = 'center';
                    this.bubbleContainer.style.cursor = 'default';
                    this.bubbleContainer.style.pointerEvents = 'auto';
                    this.bubbleContainer.appendChild(this.bubbleText = document.createTextNode(''));
                    this.bubbleContainer.appendChild(this.bubblePointer = document.createElement('div'));
                    this.bubblePointer.style.position = 'absolute';
                    this.bubblePointer.style.height = (21 / 14) + 'em';
                    this.bubblePointer.style.width = (44 / 14) + 'em';
                    this.bubblePointer.style.background = 'url("icons.svg")';
                    this.bubblePointer.style.backgroundSize = (384 / 14) + 'em ' + (64 / 14) + 'em';
                    this.bubblePointer.style.backgroundPositionY = (-4 / 14) + 'em';
                    this.stage.ui.appendChild(this.bubbleContainer);
                }
                this.bubblePointer.style.backgroundPositionX = (thinking ? -323 : -259) / 14 + 'em';
                this.bubbleContainer.style.display = 'block';
                this.bubbleText.nodeValue = text;
                this.updateBubble();
                return ++this.sayId;
            }
            /**
             * Updates the position of the speech bubble, or hides it.
             */
            updateBubble() {
                if (!this.visible || !this.saying) {
                    this.bubbleContainer.style.display = 'none';
                    return;
                }
                const b = this.rotatedBounds();
                const left = 240 + b.right;
                var bottom = 180 + b.top;
                const width = this.bubbleContainer.offsetWidth / this.stage.zoom;
                const height = this.bubbleContainer.offsetHeight / this.stage.zoom;
                this.bubblePointer.style.top = ((height - 6) / 14) + 'em';
                if (left + width + 2 > 480) {
                    this.bubbleContainer.style.right = ((240 - b.left) / 14) + 'em';
                    this.bubbleContainer.style.left = 'auto';
                    this.bubblePointer.style.right = (3 / 14) + 'em';
                    this.bubblePointer.style.left = 'auto';
                    this.bubblePointer.style.backgroundPositionY = (-36 / 14) + 'em';
                }
                else {
                    this.bubbleContainer.style.left = (left / 14) + 'em';
                    this.bubbleContainer.style.right = 'auto';
                    this.bubblePointer.style.left = (3 / 14) + 'em';
                    this.bubblePointer.style.right = 'auto';
                    this.bubblePointer.style.backgroundPositionY = (-4 / 14) + 'em';
                }
                if (bottom + height + 2 > 360) {
                    bottom = 360 - height - 2;
                }
                if (bottom < 19) {
                    bottom = 19;
                }
                this.bubbleContainer.style.bottom = (bottom / 14) + 'em';
            }
            /**
             * Tells this object to cleanup some of the things it may have created.
             */
            remove() {
                if (this.bubbleContainer) {
                    this.stage.ui.removeChild(this.bubbleContainer);
                    // I don't think doing this is necessary.
                    delete this.bubbleContainer;
                }
                if (this.node) {
                    this.node.disconnect();
                    this.node = null;
                }
            }
            /**
             * Gets this object's AudioNode, or creates it if it doesn't exist.
             * @throws Error if there is no audio context.
             */
            getAudioNode() {
                if (this.node) {
                    return this.node;
                }
                if (!P.audio.context) {
                    throw new Error('No audio context');
                }
                this.node = P.audio.context.createGain();
                this.node.gain.value = this.volume;
                P.audio.connectNode(this.node);
                return this.node;
            }
        }
        core.Base = Base;
        // A stage object
        class Stage extends Base {
            constructor() {
                super();
                this.stage = this;
                this.isStage = true;
                /**
                 * Sprites inside of this stage.
                 */
                this.children = [];
                /**
                 * All variable watchers in this stage.
                 */
                this.allWatchers = [];
                this.answer = '';
                this.promptId = 0;
                this.nextPromptId = 0;
                this.hidePrompt = false;
                this.tempoBPM = 60;
                this.zoom = 1;
                this.rawMouseX = 0;
                this.rawMouseY = 0;
                this.mouseX = 0;
                this.mouseY = 0;
                this.mousePressed = false;
                this.username = '';
                this.counter = 0;
                this._currentCostumeIndex = this.currentCostumeIndex;
                this.runtime = new P.runtime.Runtime(this);
                this.keys = [];
                this.keys.any = 0;
                this.root = document.createElement('div');
                this.root.classList.add('forkphorus-root');
                this.root.style.position = 'absolute';
                this.root.style.overflow = 'hidden';
                this.root.style.userSelect = 'none';
                const scale = P.config.scale;
                if (P.config.useWebGL) {
                    this.renderer = new P.renderer.WebGLProjectRenderer(this);
                }
                else {
                    this.renderer = new P.renderer.ProjectRenderer2D(this);
                }
                this.renderer.reset(scale);
                this.renderer.penResize(1);
                this.canvas = this.renderer.canvas;
                this.root.appendChild(this.renderer.stageLayer);
                this.root.appendChild(this.renderer.penLayer);
                this.root.appendChild(this.canvas);
                this.ui = document.createElement('div');
                this.root.appendChild(this.ui);
                this.ui.style.pointerEvents = 'none';
                this.canvas.tabIndex = 0;
                this.canvas.style.outline = 'none';
                this.root.addEventListener('keydown', (e) => {
                    var c = e.keyCode;
                    if (!this.keys[c])
                        this.keys.any++;
                    this.keys[c] = true;
                    if (e.ctrlKey || e.altKey || e.metaKey || c === 27)
                        return;
                    e.stopPropagation();
                    if (e.target === this.canvas) {
                        e.preventDefault();
                        this.runtime.trigger('whenKeyPressed', c);
                    }
                });
                this.root.addEventListener('keyup', (e) => {
                    var c = e.keyCode;
                    if (this.keys[c])
                        this.keys.any--;
                    this.keys[c] = false;
                    e.stopPropagation();
                    if (e.target === this.canvas) {
                        e.preventDefault();
                    }
                });
                this.root.addEventListener('wheel', (e) => {
                    // Scroll up/down triggers key listeners for up/down arrows, but without affecting "is key pressed?" blocks
                    if (e.deltaY > 0) {
                        // 40 = down arrow
                        this.runtime.trigger('whenKeyPressed', 40);
                    }
                    else if (e.deltaY < 0) {
                        // 38 = up arrow
                        this.runtime.trigger('whenKeyPressed', 38);
                    }
                }, { passive: true });
                if (P.config.hasTouchEvents) {
                    document.addEventListener('touchstart', (e) => {
                        if (!this.runtime.isRunning)
                            return;
                        this.mousePressed = true;
                        const target = e.target;
                        for (var i = 0; i < e.changedTouches.length; i++) {
                            const t = e.changedTouches[i];
                            this.updateMousePosition(t);
                            if (e.target === this.canvas) {
                                this.clickMouse();
                            }
                            this.ontouch(e, t);
                        }
                        if (e.target === this.canvas)
                            e.preventDefault();
                    });
                    document.addEventListener('touchmove', (e) => {
                        if (!this.runtime.isRunning)
                            return;
                        this.updateMousePosition(e.changedTouches[0]);
                        for (var i = 0; i < e.changedTouches.length; i++) {
                            const t = e.changedTouches[i];
                            this.ontouch(e, t);
                        }
                    });
                    document.addEventListener('touchend', (e) => {
                        if (!this.runtime.isRunning)
                            return;
                        this.releaseMouse();
                        for (var i = 0; i < e.changedTouches.length; i++) {
                            const t = e.changedTouches[i];
                            this.ontouch(e, t);
                        }
                    });
                }
                else {
                    document.addEventListener('mousedown', (e) => {
                        if (!this.runtime.isRunning)
                            return;
                        this.mousePressed = true;
                        this.updateMousePosition(e);
                        if (e.target === this.canvas) {
                            this.clickMouse();
                            e.preventDefault();
                            this.canvas.focus();
                        }
                        this.onmousedown(e);
                    });
                    document.addEventListener('mousemove', (e) => {
                        if (!this.runtime.isRunning)
                            return;
                        this.updateMousePosition(e);
                        this.onmousemove(e);
                    });
                    document.addEventListener('mouseup', (e) => {
                        if (!this.runtime.isRunning)
                            return;
                        this.updateMousePosition(e);
                        this.releaseMouse();
                        this.onmouseup(e);
                    });
                }
                this.prompter = document.createElement('div');
                this.ui.appendChild(this.prompter);
                this.prompter.style.zIndex = '1';
                this.prompter.style.pointerEvents = 'auto';
                this.prompter.style.position = 'absolute';
                this.prompter.style.left =
                    this.prompter.style.right = '1.4em';
                this.prompter.style.bottom = '.6em';
                this.prompter.style.padding = '.5em 3.0em .5em .5em';
                this.prompter.style.border = '.3em solid rgb(46, 174, 223)';
                this.prompter.style.borderRadius = '.8em';
                this.prompter.style.background = '#fff';
                this.prompter.style.display = 'none';
                this.promptTitle = document.createElement('div');
                this.prompter.appendChild(this.promptTitle);
                this.promptTitle.textContent = '';
                this.promptTitle.style.cursor = 'default';
                this.promptTitle.style.font = 'bold 1.3em sans-serif';
                this.promptTitle.style.margin = '0 ' + (-25 / 13) + 'em ' + (5 / 13) + 'em 0';
                this.promptTitle.style.whiteSpace = 'pre';
                this.promptTitle.style.overflow = 'hidden';
                this.promptTitle.style.textOverflow = 'ellipsis';
                this.prompt = document.createElement('input');
                this.prompter.appendChild(this.prompt);
                this.prompt.style.border = '0';
                this.prompt.style.background = '#eee';
                this.prompt.style.boxSizing = 'border-box';
                this.prompt.style.font = '1.3em sans-serif';
                this.prompt.style.padding = '0 ' + (3 / 13) + 'em';
                this.prompt.style.outline = '0';
                this.prompt.style.margin = '0';
                this.prompt.style.width = '100%';
                this.prompt.style.height = '' + (20 / 13) + 'em';
                this.prompt.style.display = 'block';
                this.prompt.style.borderRadius = '0';
                this.prompt.style.boxShadow = 'inset ' + (1 / 13) + 'em ' + (1 / 13) + 'em ' + (2 / 13) + 'em rgba(0, 0, 0, .2), inset ' + (-1 / 13) + 'em ' + (-1 / 13) + 'em ' + (1 / 13) + 'em rgba(255, 255, 255, .2)';
                this.prompt.style.webkitAppearance = 'none';
                this.promptButton = document.createElement('div');
                this.prompter.appendChild(this.promptButton);
                this.promptButton.style.width = '2.2em';
                this.promptButton.style.height = '2.2em';
                this.promptButton.style.position = 'absolute';
                this.promptButton.style.right = '.4em';
                this.promptButton.style.bottom = '.4em';
                this.promptButton.style.background = 'url(icons.svg) -22.8em -0.4em';
                this.promptButton.style.backgroundSize = '38.4em 6.4em';
                this.prompt.addEventListener('keydown', (e) => {
                    if (e.keyCode === 13) {
                        this.submitPrompt();
                    }
                });
                this.promptButton.addEventListener(P.config.hasTouchEvents ? 'touchstart' : 'mousedown', this.submitPrompt.bind(this));
            }
            // Event hooks for implementing stages to optionally use
            ontouch(e, t) {
            }
            onmousedown(e) {
            }
            onmouseup(e) {
            }
            onmousemove(e) {
            }
            /**
             * Delete the stage.
             */
            destroy() {
                this.runtime.stopAll();
                this.runtime.pause();
                this.stopAllSounds();
            }
            /**
             * Give browser focus to the Stage.
             */
            focus() {
                if (this.promptId < this.nextPromptId) {
                    this.prompt.focus();
                }
                else {
                    this.canvas.focus();
                }
            }
            updateMousePosition(e) {
                var rect = this.canvas.getBoundingClientRect();
                var x = (e.clientX - rect.left) / this.zoom - 240;
                var y = 180 - (e.clientY - rect.top) / this.zoom;
                this.rawMouseX = x;
                this.rawMouseY = y;
                if (x < -240)
                    x = -240;
                if (x > 240)
                    x = 240;
                if (y < -180)
                    y = -180;
                if (y > 180)
                    y = 180;
                this.mouseX = x;
                this.mouseY = y;
            }
            /**
             * Updates the backdrop canvas to match the current backdrop.
             */
            updateBackdrop() {
                if (!this.renderer)
                    return;
                this.renderer.updateStage(this.zoom * P.config.scale);
            }
            /**
             * Changes the zoom level and resizes DOM elements.
             */
            setZoom(zoom) {
                if (this.zoom === zoom)
                    return;
                this.renderer.penResize(zoom);
                this.root.style.width = (480 * zoom | 0) + 'px';
                this.root.style.height = (360 * zoom | 0) + 'px';
                this.root.style.fontSize = (zoom * 10) + 'px';
                this.zoom = zoom;
                this.updateBackdrop();
            }
            clickMouse() {
                this.mouseSprite = undefined;
                for (var i = this.children.length; i--;) {
                    var c = this.children[i];
                    if (c.visible && c.filters.ghost < 100 && c.touching("_mouse_" /* Mouse */)) {
                        if (c.isDraggable) {
                            this.mouseSprite = c;
                            c.mouseDown();
                        }
                        else {
                            this.runtime.triggerFor(c, 'whenClicked');
                        }
                        return;
                    }
                }
                this.runtime.triggerFor(this, 'whenClicked');
            }
            releaseMouse() {
                this.mousePressed = false;
                if (this.mouseSprite) {
                    this.mouseSprite.mouseUp();
                    this.mouseSprite = undefined;
                }
            }
            setFilter(name, value) {
                // Override setFilter() to update the filters on the real stage.
                super.setFilter(name, value);
                this.renderer.updateStageFilters();
            }
            /**
             * Gets an object with its name, ignoring clones.
             * SpecialObjects.Stage will point to the stage.
             */
            getObject(name) {
                for (var i = 0; i < this.children.length; i++) {
                    var c = this.children[i];
                    if (c.name === name && !c.isClone) {
                        return c;
                    }
                }
                if (name === "_stage_" /* Stage */ || name === this.name) {
                    return this;
                }
                return null;
            }
            /**
             * Gets all the objects with a name, including clones.
             * Special values are not supported.
             */
            getObjects(name) {
                const result = [];
                for (var i = 0; i < this.children.length; i++) {
                    if (this.children[i].name === name) {
                        result.push(this.children[i]);
                    }
                }
                return result;
            }
            /**
             * Determines the position of an object, with support for special values.
             */
            getPosition(name) {
                switch (name) {
                    case "_mouse_" /* Mouse */: return {
                        x: this.mouseX,
                        y: this.mouseY,
                    };
                    case "_random_" /* Random */: return {
                        x: Math.round(480 * Math.random() - 240),
                        y: Math.round(360 * Math.random() - 180),
                    };
                }
                const sprite = this.getObject(name);
                if (!sprite)
                    return null;
                return {
                    x: sprite.scratchX,
                    y: sprite.scratchY,
                };
            }
            /**
             * Draws this stage on it's renderer.
             */
            draw() {
                this.renderer.reset(this.zoom);
                this.drawChildren(this.renderer);
                for (var i = this.allWatchers.length; i--;) {
                    var w = this.allWatchers[i];
                    if (w.visible) {
                        w.update();
                    }
                }
                if (this.hidePrompt) {
                    this.hidePrompt = false;
                    this.prompter.style.display = 'none';
                    this.canvas.focus();
                }
            }
            /**
             * Draws all the children (not including the Stage itself or pen layers) of this Stage on a renderer
             * @param skip Optionally skip rendering of a single Sprite.
             */
            drawChildren(renderer, skip) {
                for (var i = 0; i < this.children.length; i++) {
                    const c = this.children[i];
                    if (c.isDragging) {
                        // TODO: move
                        c.moveTo(c.dragOffsetX + c.stage.mouseX, c.dragOffsetY + c.stage.mouseY);
                    }
                    if (c.visible && c !== skip) {
                        renderer.drawChild(c);
                    }
                }
            }
            /**
             * Draws all parts of the Stage (including the stage itself and pen layers) on a renderer.
             * @param skip Optionally skip rendering of a single Sprite.
             */
            drawAll(renderer, skip) {
                renderer.drawChild(this);
                renderer.drawLayer(this.renderer.penLayer);
                this.drawChildren(renderer, skip);
            }
            // Implement rotatedBounds() to return something.
            rotatedBounds() {
                return {
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                };
            }
            // Override currentCostumeIndex to automatically update the backdrop when a change is made.
            get currentCostumeIndex() {
                return this._currentCostumeIndex;
            }
            set currentCostumeIndex(index) {
                this._currentCostumeIndex = index;
                this.updateBackdrop();
            }
            // Implementing Scratch blocks
            stopAllSounds() {
                for (var children = this.children, i = children.length; i--;) {
                    children[i].stopSounds();
                }
                this.stopSounds();
                this.runtime.stopSounds = this.runtime.playingSounds;
            }
            removeAllClones() {
                var i = this.children.length;
                while (i--) {
                    if (this.children[i].isClone) {
                        this.children[i].remove();
                        this.children.splice(i, 1);
                    }
                }
            }
            moveTo() {
                // do nothing -- stage cannot be moved
            }
            submitPrompt() {
                if (this.promptId < this.nextPromptId) {
                    this.answer = this.prompt.value;
                    this.promptId += 1;
                    if (this.promptId >= this.nextPromptId) {
                        this.hidePrompt = true;
                    }
                }
            }
            clearPen() {
                this.renderer.penClear();
            }
        }
        core.Stage = Stage;
        // A sprite object
        class Sprite extends Base {
            constructor(stage) {
                super();
                this.isSprite = true;
                /**
                 * Is this Sprite a clone of another Sprite?
                 */
                this.isClone = false;
                /**
                 * The direction this Sprite is facing.
                 * 0 is directly up, and 90 is directly right.
                 */
                this.direction = 90;
                /**
                 * How this object rotates.
                 */
                this.rotationStyle = 0 /* Normal */;
                /**
                 * Can this Sprite be dragged?
                 */
                this.isDraggable = false;
                /**
                 * Is this Sprite currently being dragged?
                 */
                this.isDragging = false;
                /**
                 * This sprite's size, with 1 being 100% (normal size)
                 * Sprites are scaled from their costume's center
                 */
                this.scale = 1;
                // Pen data
                this.penHue = 240;
                this.penSaturation = 100;
                this.penLightness = 50;
                this.penAlpha = 1;
                this.penCSS = '';
                this.penSize = 1;
                this.penColor = 0x000000;
                this.isPenDown = false;
                // It's related to dragging sprites.
                this.dragStartX = 0;
                this.dragStartY = 0;
                this.dragOffsetX = 0;
                this.dragOffsetY = 0;
                this.stage = stage;
            }
            mouseDown() {
                this.dragStartX = this.scratchX;
                this.dragStartY = this.scratchY;
                this.dragOffsetX = this.scratchX - this.stage.mouseX;
                this.dragOffsetY = this.scratchY - this.stage.mouseY;
                this.isDragging = true;
            }
            mouseUp() {
                // We consider a sprite to be clicked if it has been dragged to the same start & end points
                if (this.isDragging && this.scratchX === this.dragStartX && this.scratchY === this.dragStartY) {
                    this.stage.runtime.triggerFor(this, 'whenClicked');
                }
                this.isDragging = false;
            }
            // Determines the rotated bounds of the sprite.
            rotatedBounds() {
                const costume = this.costumes[this.currentCostumeIndex];
                const scale = costume.scale * this.scale;
                var left = -costume.rotationCenterX * scale;
                var top = costume.rotationCenterY * scale;
                var right = left + costume.width * scale;
                var bottom = top - costume.height * scale;
                if (this.rotationStyle !== 0 /* Normal */) {
                    if (this.rotationStyle === 1 /* LeftRight */ && this.direction < 0) {
                        right = -left;
                        left = right - costume.width * costume.scale * this.scale;
                    }
                    return {
                        left: this.scratchX + left,
                        right: this.scratchX + right,
                        top: this.scratchY + top,
                        bottom: this.scratchY + bottom
                    };
                }
                const mSin = Math.sin(this.direction * Math.PI / 180);
                const mCos = Math.cos(this.direction * Math.PI / 180);
                // Top left
                const tlX = mSin * left - mCos * top;
                const tlY = mCos * left + mSin * top;
                // Top right
                const trX = mSin * right - mCos * top;
                const trY = mCos * right + mSin * top;
                // Bottom left
                const blX = mSin * left - mCos * bottom;
                const blY = mCos * left + mSin * bottom;
                // Bottom right
                const brX = mSin * right - mCos * bottom;
                const brY = mCos * right + mSin * bottom;
                return {
                    left: this.scratchX + Math.min(tlX, trX, blX, brX),
                    right: this.scratchX + Math.max(tlX, trX, blX, brX),
                    top: this.scratchY + Math.max(tlY, trY, blY, brY),
                    bottom: this.scratchY + Math.min(tlY, trY, blY, brY)
                };
            }
            // Shows the rotated bounds of the sprite. For debugging.
            showRotatedBounds() {
                var bounds = this.rotatedBounds();
                var div = document.createElement('div');
                div.style.outline = '1px solid red';
                div.style.position = 'absolute';
                div.style.left = (240 + bounds.left) + 'px';
                div.style.top = (180 - bounds.top) + 'px';
                div.style.width = (bounds.right - bounds.left) + 'px';
                div.style.height = (bounds.top - bounds.bottom) + 'px';
                this.stage.canvas.parentNode.appendChild(div);
            }
            // Implementing Scratch blocks
            createVariableWatcher(target, variableName) {
                // Asking our parent to handle it is easier.
                return this.stage.createVariableWatcher(target, variableName);
            }
            // Moves forward some number of steps in the current direction.
            forward(steps) {
                const d = (90 - this.direction) * Math.PI / 180;
                this.moveTo(this.scratchX + steps * Math.cos(d), this.scratchY + steps * Math.sin(d));
            }
            // Moves the sprite to a coordinate
            // Draws a line if the pen is currently down.
            moveTo(x, y) {
                var ox = this.scratchX;
                var oy = this.scratchY;
                if (ox === x && oy === y && !this.isPenDown) {
                    return;
                }
                this.scratchX = x;
                this.scratchY = y;
                if (this.isPenDown && !this.isDragging) {
                    this.stage.renderer.penLine(this.getPenCSS(), this.penSize, ox, oy, x, y);
                }
                if (this.saying) {
                    this.updateBubble();
                }
            }
            // Makes a pen dot at the current location.
            dotPen() {
                this.stage.renderer.penDot(this.getPenCSS(), this.penSize, this.scratchX, this.scratchY);
            }
            // Stamps the sprite onto the pen layer.
            stamp() {
                this.stage.renderer.penStamp(this);
            }
            getPenCSS() {
                // This is only temporary
                return this.penCSS || 'hsla(' + this.penHue + 'deg,' + this.penSaturation + '%,' + (this.penLightness > 100 ? 200 - this.penLightness : this.penLightness) + '%, ' + this.penAlpha + ')';
            }
            // Faces in a direction.
            setDirection(degrees) {
                var d = degrees % 360;
                if (d > 180)
                    d -= 360;
                if (d <= -180)
                    d += 360;
                this.direction = d;
                if (this.saying)
                    this.updateBubble();
            }
            // Clones this sprite.
            clone() {
                const clone = this._clone();
                clone.isClone = true;
                // Copy variables and lists without passing reference
                for (const key of Object.keys(this.vars)) {
                    clone.vars[key] = this.vars[key];
                }
                for (const key of Object.keys(this.lists)) {
                    clone.lists[key] = this.lists[key].slice(0);
                }
                clone.filters = {
                    color: this.filters.color,
                    fisheye: this.filters.fisheye,
                    whirl: this.filters.whirl,
                    pixelate: this.filters.pixelate,
                    mosaic: this.filters.mosaic,
                    brightness: this.filters.brightness,
                    ghost: this.filters.ghost
                };
                // Copy scripts
                clone.procedures = this.procedures;
                clone.listeners = this.listeners;
                clone.fns = this.fns;
                // Copy Data
                clone.name = this.name;
                clone.costumes = this.costumes;
                clone.currentCostumeIndex = this.currentCostumeIndex;
                clone.sounds = this.sounds;
                clone.soundRefs = this.soundRefs;
                clone.direction = this.direction;
                clone.instrument = this.instrument;
                clone.isDraggable = this.isDraggable;
                clone.rotationStyle = this.rotationStyle;
                clone.scale = this.scale;
                clone.volume = this.volume;
                clone.scratchX = this.scratchX;
                clone.scratchY = this.scratchY;
                clone.visible = this.visible;
                clone.penColor = this.penColor;
                clone.penCSS = this.penCSS;
                clone.penHue = this.penHue;
                clone.penSaturation = this.penSaturation;
                clone.penLightness = this.penLightness;
                clone.penSize = this.penSize;
                clone.isPenDown = this.isPenDown;
                return clone;
            }
            /**
             * Determines if this sprite is touching another object.
             * @param thing The name of the other object(s)
             */
            touching(thing) {
                if (thing === "_mouse_" /* Mouse */) {
                    const x = this.stage.rawMouseX;
                    const y = this.stage.rawMouseY;
                    return this.stage.renderer.spriteTouchesPoint(this, x, y);
                }
                else if (thing === "_edge_" /* Edge */) {
                    const bounds = this.rotatedBounds();
                    return bounds.left <= -240 || bounds.right >= 240 || bounds.top >= 180 || bounds.bottom <= -180;
                }
                else {
                    if (!this.visible)
                        return false;
                    const sprites = this.stage.getObjects(thing);
                    return this.stage.renderer.spritesIntersect(this, sprites);
                }
            }
            /**
             * Determines if this Sprite is touching a color.
             * @param color RGB color, as a single number.
             */
            touchingColor(color) {
                return this.stage.renderer.spriteTouchesColor(this, color);
            }
            /**
             * Determines if one of this Sprite's colors are touching another color.
             * @param sourceColor This sprite's color, as an RGB color.
             * @param touchingColor The other color, as an RGB color.
             */
            colorTouchingColor(sourceColor, touchingColor) {
                return this.stage.renderer.spriteColorTouchesColor(this, sourceColor, touchingColor);
            }
            /**
             * Bounces this Sprite off of an edge of the Stage, if this Sprite is touching one.
             */
            bounceOffEdge() {
                var b = this.rotatedBounds();
                var dl = 240 + b.left;
                var dt = 180 - b.top;
                var dr = 240 - b.right;
                var db = 180 + b.bottom;
                var d = Math.min(dl, dt, dr, db);
                if (d > 0)
                    return;
                var dir = this.direction * Math.PI / 180;
                var dx = Math.sin(dir);
                var dy = -Math.cos(dir);
                switch (d) {
                    case dl:
                        dx = Math.max(0.2, Math.abs(dx));
                        break;
                    case dt:
                        dy = Math.max(0.2, Math.abs(dy));
                        break;
                    case dr:
                        dx = -Math.max(0.2, Math.abs(dx));
                        break;
                    case db:
                        dy = -Math.max(0.2, Math.abs(dy));
                        break;
                }
                this.direction = Math.atan2(dy, dx) * 180 / Math.PI + 90;
                if (this.saying)
                    this.updateBubble();
                b = this.rotatedBounds();
                var x = this.scratchX;
                var y = this.scratchY;
                if (b.left < -240)
                    x += -240 - b.left;
                if (b.top > 180)
                    y += 180 - b.top;
                if (b.right > 240)
                    x += 240 - b.left;
                if (b.bottom < -180)
                    y += -180 - b.top;
            }
            /**
             * Determines the distance from this Sprite's center to another position.
             * @param thing The name of any position or Sprite, as accepted by getPosition()
             */
            distanceTo(thing) {
                const p = this.stage.getPosition(thing);
                if (!p) {
                    return 10000;
                }
                const x = p.x;
                const y = p.y;
                return Math.sqrt((this.scratchX - x) * (this.scratchX - x) + (this.scratchY - y) * (this.scratchY - y));
            }
            /**
             * Makes this Sprite go to another Sprite
             * @param thing The name of any position or Sprite, as accepted by getPosition()
             */
            gotoObject(thing) {
                const position = this.stage.getPosition(thing);
                if (!position) {
                    return 0;
                }
                this.moveTo(position.x, position.y);
            }
            /**
             * Makes this Sprite point towards another object.
             * @param thing The name of any position or Sprite, as accepted by getPosition()
             */
            pointTowards(thing) {
                const position = this.stage.getPosition(thing);
                if (!position) {
                    return 0;
                }
                const dx = position.x - this.scratchX;
                const dy = position.y - this.scratchY;
                this.direction = dx === 0 && dy === 0 ? 90 : Math.atan2(dx, dy) * 180 / Math.PI;
                if (this.saying)
                    this.updateBubble();
            }
            /**
             * Set the RGB color of the pen.
             */
            setPenColor(color) {
                this.penColor = color;
                const r = this.penColor >> 16 & 0xff;
                const g = this.penColor >> 8 & 0xff;
                const b = this.penColor & 0xff;
                const a = this.penColor >> 24 & 0xff / 0xff || 1;
                this.penCSS = 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
            }
            /**
             * Convert the pen's color from RGB to HSL
             */
            setPenColorHSL() {
                if (this.penCSS) {
                    const hsl = P.utils.rgbToHSL(this.penColor);
                    this.penHue = hsl[0];
                    this.penSaturation = hsl[1];
                    this.penLightness = hsl[2];
                    this.penAlpha = this.penColor >> 24 & 0xff / 0xff || 1;
                    this.penCSS = '';
                }
            }
            // Sets a pen color HSL parameter.
            setPenColorParam(param, value) {
                this.setPenColorHSL();
                switch (param) {
                    case 'color':
                        this.penHue = value * 360 / 100;
                        break;
                    case 'saturation':
                        this.penSaturation = value;
                        break;
                    case 'brightness':
                        this.penLightness = value % 200;
                        if (this.penLightness < 0) {
                            this.penLightness += 200;
                        }
                        break;
                    case 'transparency':
                        this.penAlpha -= value / 100;
                        if (this.penAlpha > 1)
                            this.penAlpha = 1;
                        if (this.penAlpha < 0)
                            this.penAlpha = 0;
                        break;
                }
            }
            // Changes a pen color HSL parameter.
            changePenColorParam(param, value) {
                this.setPenColorHSL();
                switch (param) {
                    case 'color':
                        this.penHue += value * 360 / 100;
                        break;
                    case 'saturation':
                        this.penSaturation += value;
                        break;
                    case 'brightness':
                        this.penLightness = (this.penLightness + value) % 200;
                        if (this.penLightness < 0) {
                            this.penLightness += 200;
                        }
                        break;
                    case 'transparency':
                        this.penAlpha = Math.max(0, Math.min(1, value / 100));
                        break;
                }
            }
        }
        core.Sprite = Sprite;
        // A costume
        class Costume {
            constructor(costumeData) {
                this.bitmapResolution = costumeData.bitmapResolution;
                this.scale = 1 / this.bitmapResolution;
                this.name = costumeData.name;
                this.rotationCenterX = costumeData.rotationCenterX;
                this.rotationCenterY = costumeData.rotationCenterY;
            }
        }
        core.Costume = Costume;
        class BitmapCostume extends Costume {
            constructor(source, options) {
                super(options);
                this.source = source;
                if (source.tagName === 'CANVAS') {
                    const ctx = source.getContext('2d');
                    if (!ctx) {
                        throw new Error('Cannot get 2d rendering context of costume source');
                    }
                    this._context = ctx;
                }
                else {
                    this._context = null;
                }
                this.width = source.width;
                this.height = source.height;
            }
            get(scale) {
                // Bitmap costumes do not have different resolutions
                return this.source;
            }
            getContext() {
                if (this._context)
                    return this._context;
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    throw new Error('cannot get 2d rendering context');
                }
                canvas.width = this.width;
                canvas.height = this.height;
                ctx.drawImage(this.source, 0, 0);
                this._context = ctx;
                return ctx;
            }
        }
        core.BitmapCostume = BitmapCostume;
        class VectorCostume extends Costume {
            constructor(svg, options) {
                super(options);
                this.scales = [];
                if (svg.height < 1 || svg.width < 1) {
                    svg = new Image(1, 1);
                }
                this.width = svg.width;
                this.height = svg.height;
                this.source = svg;
            }
            getScale(scale) {
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, this.width * scale);
                canvas.height = Math.max(1, this.height * scale);
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    throw new Error('cannot get 2d rendering context');
                }
                ctx.drawImage(this.source, 0, 0, canvas.width, canvas.height);
                return canvas;
            }
            get(scale) {
                scale = Math.ceil(scale);
                if (!this.scales[scale]) {
                    this.scales[scale] = this.getScale(scale);
                }
                return this.scales[scale];
            }
            getContext() {
                if (this._context)
                    return this._context;
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    throw new Error('cannot get 2d rendering context');
                }
                canvas.width = this.width;
                canvas.height = this.height;
                ctx.drawImage(this.source, 0, 0);
                this._context = ctx;
                return ctx;
            }
        }
        core.VectorCostume = VectorCostume;
        // A sound
        class Sound {
            constructor(data) {
                this.source = null;
                if (!data.buffer)
                    throw new Error('no AudioBuffer');
                this.name = data.name;
                this.buffer = data.buffer;
                this.duration = this.buffer.duration;
            }
            createSourceNode() {
                if (this.source) {
                    this.source.disconnect();
                }
                this.source = P.audio.context.createBufferSource();
                this.source.buffer = this.buffer;
                this.source.start();
                return this.source;
            }
        }
        core.Sound = Sound;
        class Watcher {
            constructor(stage, targetName) {
                this.valid = true;
                this.visible = true;
                this.x = 0;
                this.y = 0;
                // The stage this variable watcher belongs to.
                this.stage = stage;
                // The name of the owner of this watcher, if any.
                this.targetName = targetName;
            }
            // Initializes the Watcher. Called once.
            // Expected to be overridden.
            init() {
                this.target = this.stage.getObject(this.targetName) || this.stage;
            }
            // The intended way to change visibility
            setVisible(visible) {
                this.visible = visible;
            }
        }
        core.Watcher = Watcher;
        // An abstract callable procedure
        class Procedure {
            constructor(fn, warp, inputs) {
                this.fn = fn;
                this.warp = warp;
                this.inputs = inputs;
            }
        }
        core.Procedure = Procedure;
        /**
         * Determines if an object is a sprite
         * Can be used to ease type assertions.
         */
        function isSprite(base) {
            return base.isSprite;
        }
        core.isSprite = isSprite;
    })(core = P.core || (P.core = {}));
})(P || (P = {}));
/// <reference path="phosphorus.ts" />
/**
 * Font helpers
 */
var P;
(function (P) {
    var fonts;
    (function (fonts_1) {
        const fontFamilyCache = {};
        fonts_1.scratch3 = {
            'Marker': 'fonts/Knewave-Regular.woff',
            'Handwriting': 'fonts/Handlee-Regular.woff',
            'Pixel': 'fonts/Grand9K-Pixel.ttf',
            'Curly': 'fonts/Griffy-Regular.woff',
            'Serif': 'fonts/SourceSerifPro-Regular.woff',
            'Sans Serif': 'fonts/NotoSans-Regular.woff',
            'Scratch': 'fonts/Scratch.ttf',
        };
        /**
         * Asynchronously load and cache a font
         */
        function loadLocalFont(fontFamily, src) {
            if (fontFamilyCache[fontFamily]) {
                return Promise.resolve(fontFamilyCache[fontFamily]);
            }
            return new P.IO.BlobRequest(src, { local: true }).load()
                .then((blob) => P.IO.readers.toDataURL(blob))
                .then((url) => {
                fontFamilyCache[fontFamily] = url;
                return url;
            });
        }
        /**
         * Gets an already loaded and cached font
         */
        function getFont(fontFamily) {
            if (!(fontFamily in fontFamilyCache)) {
                throw new Error('unknown font: ' + fontFamily);
            }
            return fontFamilyCache[fontFamily];
        }
        function loadFontSet(fonts) {
            const promises = [];
            for (const family in fonts) {
                promises.push(P.utils.settled(loadLocalFont(family, fonts[family])));
            }
            return Promise.all(promises);
        }
        fonts_1.loadFontSet = loadFontSet;
        function getCSSFontFace(src, fontFamily) {
            return `@font-face { font-family: "${fontFamily}"; src: url("${src}"); }`;
        }
        /**
         * Add an inline <style> element to an SVG containing fonts loaded through loadFontSet
         */
        function addFontRules(svg, fonts) {
            const cssRules = [];
            for (const font of fonts) {
                // Dirty hack: we'll just assume helvetica is already present on the user's machine
                if (font === 'Helvetica')
                    continue;
                cssRules.push(getCSSFontFace(getFont(font), font));
            }
            const doc = svg.ownerDocument;
            const defs = doc.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const style = doc.createElementNS('http://www.w3.org/2000/svg', 'style');
            style.innerHTML = cssRules.join('\n');
            defs.appendChild(style);
            svg.appendChild(style);
        }
        fonts_1.addFontRules = addFontRules;
        /**
         * Load a CSS @font-face font.
         */
        function loadWebFont(name) {
            const observer = new FontFaceObserver(name);
            return observer.load();
        }
        fonts_1.loadWebFont = loadWebFont;
    })(fonts = P.fonts || (P.fonts = {}));
})(P || (P = {}));
/// <reference path="phosphorus.ts" />
// IO helpers and hooks
var P;
(function (P) {
    var IO;
    (function (IO) {
        // Hooks that can be replaced by other scripts to hook into progress reports.
        IO.progressHooks = {
            // Indicates that a new task has started
            new() { },
            // Indicates that a task has finished successfully
            end() { },
            // Sets the current progress, should override new() and end()
            set(p) { },
            // Indicates an error has occurred and the project will likely fail to load
            error(error) { },
        };
        /**
         * Configuration of IO behavior
         */
        IO.config = {
            /**
             * A relative or absolute path to a full installation of forkphorus, from which "local" files can be fetched.
             * Do not including a trailing slash.
             */
            localPath: '',
        };
        // non-http/https protocols cannot xhr request local files, so utilize forkphorus.github.io instead
        if (['http:', 'https:'].indexOf(location.protocol) === -1) {
            IO.config.localPath = 'https://forkphorus.github.io';
        }
        class Request {
            constructor(url, options = {}) {
                if (options.local) {
                    if (url.indexOf('data:') !== 0) {
                        url = IO.config.localPath + url;
                    }
                }
                this.url = url;
            }
            /**
             * Attempts to load this request.
             */
            load() {
                // We attempt to load twice, which I hope will fix random loading errors from failed fetches.
                return new Promise((resolve, reject) => {
                    const attempt = (errorCallback) => {
                        this._load()
                            .then((response) => {
                            resolve(response);
                            IO.progressHooks.end();
                        })
                            .catch((err) => {
                            errorCallback(err);
                        });
                    };
                    IO.progressHooks.new();
                    attempt(() => {
                        // try once more
                        attempt((err) => {
                            reject(err);
                        });
                    });
                });
            }
        }
        IO.Request = Request;
        class XHRRequest extends Request {
            _load() {
                return new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.addEventListener('load', () => {
                        resolve(xhr.response);
                    });
                    xhr.addEventListener('error', (err) => {
                        reject(err);
                    });
                    xhr.responseType = this.type;
                    xhr.open('GET', this.url);
                    xhr.send();
                });
            }
        }
        class ArrayBufferRequest extends XHRRequest {
            get type() { return 'arraybuffer'; }
        }
        IO.ArrayBufferRequest = ArrayBufferRequest;
        class BlobRequest extends XHRRequest {
            get type() { return 'blob'; }
        }
        IO.BlobRequest = BlobRequest;
        class TextRequest extends XHRRequest {
            get type() { return 'text'; }
        }
        IO.TextRequest = TextRequest;
        class JSONRequest extends XHRRequest {
            get type() { return 'json'; }
        }
        IO.JSONRequest = JSONRequest;
        /**
         * Read a file as an ArrayBuffer
         */
        function fileAsArrayBuffer(file) {
            const fileReader = new FileReader();
            return new Promise((resolve, reject) => {
                fileReader.onloadend = function () {
                    resolve(fileReader.result);
                };
                fileReader.onerror = function (err) {
                    reject('Failed to load file');
                };
                fileReader.onprogress = function (progress) {
                    IO.progressHooks.set(progress);
                };
                fileReader.readAsArrayBuffer(file);
            });
        }
        IO.fileAsArrayBuffer = fileAsArrayBuffer;
        /**
         * Utilities for asynchronously reading Blobs or Files
         */
        let readers;
        (function (readers) {
            function toArrayBuffer(object) {
                return new Promise((resolve, reject) => {
                    const fileReader = new FileReader();
                    fileReader.onloadend = function () {
                        resolve(fileReader.result);
                    };
                    fileReader.onerror = function (err) {
                        reject('Could not read object');
                    };
                    fileReader.onprogress = function (progress) {
                        IO.progressHooks.set(progress);
                    };
                    fileReader.readAsArrayBuffer(object);
                });
            }
            readers.toArrayBuffer = toArrayBuffer;
            function toDataURL(object) {
                return new Promise((resolve, reject) => {
                    const fileReader = new FileReader();
                    fileReader.onloadend = function () {
                        resolve(fileReader.result);
                    };
                    fileReader.onerror = function (err) {
                        reject('Could not read object');
                    };
                    fileReader.onprogress = function (progress) {
                        IO.progressHooks.set(progress);
                    };
                    fileReader.readAsDataURL(object);
                });
            }
            readers.toDataURL = toDataURL;
        })(readers = IO.readers || (IO.readers = {}));
    })(IO = P.IO || (P.IO = {}));
})(P || (P = {}));
/// <reference path="phosphorus.ts" />
/// <reference path="core.ts" />
/// <reference path="audio.ts" />
// The phosphorus runtime for Scratch
// Provides methods expected at runtime by scripts created by the compiler and an environment for Scratch scripts to run
var P;
(function (P) {
    var runtime;
    (function (runtime_1) {
        // Global variables expected by scripts at runtime:
        // Current runtime
        var runtime;
        // Current stage
        var self;
        // Current sprite or stage
        var S;
        // Current thread state.
        var R;
        // Stack of states (R) for this thread
        var STACK;
        // Current procedure call, if any. Contains arguments.
        var C;
        // This thread's call (C) stack
        var CALLS;
        // If level of layers of "Run without screen refresh" we are in
        // Each level (usually procedures) of depth will increment and decrement as they start and stop.
        // As long as this is greater than 0, functions will run without waiting for the screen.
        var WARP;
        // ??
        var BASE;
        // The ID of the active thread in the Runtime's queue
        var THREAD;
        // The next function to run immediately after this one.
        var IMMEDIATE;
        // Has a "visual change" been made in this frame?
        var VISUAL;
        // Note:
        // Your editor might warn you about "unused variables" or things like that.
        // That is a complete lie and you should disregard such warnings.
        const epoch = Date.UTC(2000, 0, 1);
        const INSTRUMENTS = P.audio.instruments;
        const DRUMS = P.audio.drums;
        const DIGIT = /\d/;
        // Converts a value to its boolean equivalent
        var bool = function (v) {
            return +v !== 0 && v !== '' && v !== 'false' && v !== false;
        };
        // Compares two values. Returns -1 if x < y, 1 if x > y, 0 if x === y
        var compare = function (x, y) {
            if ((typeof x === 'number' || DIGIT.test(x)) && (typeof y === 'number' || DIGIT.test(y))) {
                var nx = +x;
                var ny = +y;
                if (nx === nx && ny === ny) {
                    return nx < ny ? -1 : nx === ny ? 0 : 1;
                }
            }
            var xs = ('' + x).toLowerCase();
            var ys = ('' + y).toLowerCase();
            return xs < ys ? -1 : xs === ys ? 0 : 1;
        };
        // Determines if y is less than nx
        var numLess = function (nx, y) {
            if (typeof y === 'number' || DIGIT.test(y)) {
                var ny = +y;
                if (ny === ny) {
                    return nx < ny;
                }
            }
            var ys = ('' + y).toLowerCase();
            return '' + nx < ys;
        };
        // Determines if y is greater than nx
        var numGreater = function (nx, y) {
            if (typeof y === 'number' || DIGIT.test(y)) {
                var ny = +y;
                if (ny === ny) {
                    return nx > ny;
                }
            }
            var ys = ('' + y).toLowerCase();
            return '' + nx > ys;
        };
        // Determines if x is equal to y
        var equal = function (x, y) {
            // numbers, booleans, and strings that look like numbers will go through the number comparison
            if ((typeof x === 'number' || typeof x === 'boolean' || DIGIT.test(x)) && (typeof y === 'number' || typeof x === 'boolean' || DIGIT.test(y))) {
                var nx = +x;
                var ny = +y;
                // if either is NaN, don't do the comparison
                if (nx === nx && ny === ny) {
                    return nx === ny;
                }
            }
            var xs = ('' + x).toLowerCase();
            var ys = ('' + y).toLowerCase();
            return xs === ys;
        };
        // Determines if x (number) and y (number) are equal to each other
        var numEqual = function (nx, y) {
            if (typeof y === 'number' || DIGIT.test(y)) {
                var ny = +y;
                return ny === ny && nx === ny;
            }
            return false;
        };
        // Modulo
        var mod = function (x, y) {
            var r = x % y;
            if (r / y < 0) {
                r += y;
            }
            return r;
        };
        // Random number in range
        var random = function (x, y) {
            x = +x || 0;
            y = +y || 0;
            if (x > y) {
                var tmp = y;
                y = x;
                x = tmp;
            }
            if (x % 1 === 0 && y % 1 === 0) {
                return Math.floor(Math.random() * (y - x + 1)) + x;
            }
            return Math.random() * (y - x) + x;
        };
        // Converts an RGB color as a number to HSL
        var rgb2hsl = function (rgb) {
            // TODO: P.utils.rgb2hsl?
            var r = (rgb >> 16 & 0xff) / 0xff;
            var g = (rgb >> 8 & 0xff) / 0xff;
            var b = (rgb & 0xff) / 0xff;
            var min = Math.min(r, g, b);
            var max = Math.max(r, g, b);
            if (min === max) {
                return [0, 0, r * 100];
            }
            var c = max - min;
            var l = (min + max) / 2;
            var s = c / (1 - Math.abs(2 * l - 1));
            var h;
            switch (max) {
                case r:
                    h = ((g - b) / c + 6) % 6;
                    break;
                case g:
                    h = (b - r) / c + 2;
                    break;
                case b:
                    h = (r - g) / c + 4;
                    break;
            }
            h *= 60;
            return [h, s * 100, l * 100];
        };
        // Clone a sprite
        var clone = function (name) {
            const parent = name === '_myself_' ? S : self.getObject(name);
            if (!parent) {
                throw new Error('No parent!');
            }
            if (!P.core.isSprite(parent)) {
                throw new Error('Cannot clone non-sprite object');
            }
            const c = parent.clone();
            self.children.splice(self.children.indexOf(parent), 0, c);
            runtime.triggerFor(c, 'whenCloned');
        };
        var getVars = function (name) {
            return self.vars[name] !== undefined ? self.vars : S.vars;
        };
        var getLists = function (name) {
            if (self.lists[name] !== undefined)
                return self.lists;
            if (S.lists[name] === undefined) {
                S.lists[name] = [];
            }
            return S.lists;
        };
        var listIndex = function (list, index, length) {
            var i = index | 0;
            if (i === index)
                return i > 0 && i <= length ? i - 1 : -1;
            if (index === 'random' || index === 'any') {
                return Math.random() * length | 0;
            }
            if (index === 'last') {
                return length - 1;
            }
            return i > 0 && i <= length ? i - 1 : -1;
        };
        var contentsOfList = function (list) {
            var isSingle = true;
            for (var i = list.length; i--;) {
                if (list[i].length !== 1) {
                    isSingle = false;
                    break;
                }
            }
            return list.join(isSingle ? '' : ' ');
        };
        var getLineOfList = function (list, index) {
            var i = listIndex(list, index, list.length);
            return i !== -1 ? list[i] : '';
        };
        var listContains = function (list, value) {
            for (var i = list.length; i--;) {
                if (equal(list[i], value))
                    return true;
            }
            return false;
        };
        var listIndexOf = function (list, value) {
            for (var i = list.length; i--;) {
                if (equal(list[i], value))
                    return i + 1;
            }
            return 0;
        };
        var appendToList = function (list, value) {
            list.push(value);
        };
        var deleteLineOfList = function (list, index) {
            if (index === 'all') {
                list.length = 0;
            }
            else {
                var i = listIndex(list, index, list.length);
                if (i === list.length - 1) {
                    list.pop();
                }
                else if (i !== -1) {
                    list.splice(i, 1);
                }
            }
        };
        var insertInList = function (list, index, value) {
            var i = listIndex(list, index, list.length + 1);
            if (i === list.length) {
                list.push(value);
            }
            else if (i !== -1) {
                list.splice(i, 0, value);
            }
        };
        var setLineOfList = function (list, index, value) {
            var i = listIndex(list, index, list.length);
            if (i !== -1) {
                list[i] = value;
            }
        };
        var mathFunc = function (f, x) {
            switch (f) {
                case 'abs':
                    return Math.abs(x);
                case 'floor':
                    return Math.floor(x);
                case 'sqrt':
                    return Math.sqrt(x);
                case 'ceiling':
                    return Math.ceil(x);
                case 'cos':
                    return Math.cos(x * Math.PI / 180);
                case 'sin':
                    return Math.sin(x * Math.PI / 180);
                case 'tan':
                    return Math.tan(x * Math.PI / 180);
                case 'asin':
                    return Math.asin(x) * 180 / Math.PI;
                case 'acos':
                    return Math.acos(x) * 180 / Math.PI;
                case 'atan':
                    return Math.atan(x) * 180 / Math.PI;
                case 'ln':
                    return Math.log(x);
                case 'log':
                    return Math.log(x) / Math.LN10;
                case 'e ^':
                    return Math.exp(x);
                case '10 ^':
                    return Math.exp(x * Math.LN10);
            }
            return 0;
        };
        var attribute = function (attr, objName) {
            // https://github.com/LLK/scratch-vm/blob/e236d29ff5e03f7c4d77a614751da860521771fd/src/blocks/scratch3_sensing.js#L280
            const o = self.getObject(objName);
            if (!o)
                return 0;
            if (P.core.isSprite(o)) {
                switch (attr) {
                    case 'x position': return o.scratchX;
                    case 'y position': return o.scratchY;
                    case 'direction': return o.direction;
                    case 'costume #': return o.currentCostumeIndex + 1;
                    case 'costume name': return o.costumes[o.currentCostumeIndex].name;
                    case 'size': return o.scale * 100;
                    case 'volume': return o.volume * 100;
                }
            }
            else {
                switch (attr) {
                    case 'background #':
                    case 'backdrop #': return o.currentCostumeIndex + 1;
                    case 'backdrop name': return o.costumes[o.currentCostumeIndex].name;
                    case 'volume': return o.volume * 100;
                }
            }
            const value = o.vars[attr];
            if (value !== undefined) {
                return value;
            }
            return 0;
        };
        var timeAndDate = function (format) {
            switch (format) {
                case 'year':
                    return new Date().getFullYear();
                case 'month':
                    return new Date().getMonth() + 1;
                case 'date':
                    return new Date().getDate();
                case 'day of week':
                    return new Date().getDay() + 1;
                case 'hour':
                    return new Date().getHours();
                case 'minute':
                    return new Date().getMinutes();
                case 'second':
                    return new Date().getSeconds();
            }
            return 0;
        };
        /**
         * Converts the name of a key to its code
         */
        function getKeyCode(keyName) {
            switch (keyName.toLowerCase()) {
                case 'space': return 32;
                case 'left arrow': return 37;
                case 'up arrow': return 38;
                case 'right arrow': return 39;
                case 'down arrow': return 40;
                case 'any': return 'any';
            }
            return keyName.toUpperCase().charCodeAt(0);
        }
        runtime_1.getKeyCode = getKeyCode;
        // Load audio methods if audio is supported
        const audioContext = P.audio.context;
        if (audioContext) {
            var playNote = function (key, duration) {
                var span;
                var spans = INSTRUMENTS[S.instrument];
                for (var i = 0, l = spans.length; i < l; i++) {
                    span = spans[i];
                    if (span.top >= key || span.top === 128)
                        break;
                }
                P.audio.playSpan(span, key, duration, S.getAudioNode());
            };
            var playSpan = function (span, key, duration) {
                P.audio.playSpan(span, key, duration, S.getAudioNode());
            };
            var playSound = function (sound) {
                sound.createSourceNode().connect(S.getAudioNode());
            };
        }
        var save = function () {
            STACK.push(R);
            R = {};
        };
        var restore = function () {
            R = STACK.pop();
        };
        var call = function (procedure, id, values) {
            if (procedure) {
                STACK.push(R);
                CALLS.push(C);
                C = {
                    base: procedure.fn,
                    fn: S.fns[id],
                    args: procedure.call(values),
                    numargs: [],
                    boolargs: [],
                    stack: STACK = [],
                    warp: procedure.warp,
                };
                R = {};
                if (C.warp || WARP) {
                    WARP++;
                    IMMEDIATE = procedure.fn;
                }
                else {
                    for (var i = CALLS.length, j = 5; i-- && j--;) {
                        if (CALLS[i].base === procedure.fn) {
                            runtime.queue[THREAD] = new Thread(S, BASE, procedure.fn, CALLS);
                            break;
                        }
                    }
                    IMMEDIATE = procedure.fn;
                }
            }
            else {
                IMMEDIATE = S.fns[id];
            }
        };
        var endCall = function () {
            if (CALLS.length) {
                if (WARP)
                    WARP--;
                IMMEDIATE = C.fn;
                C = CALLS.pop();
                STACK = C.stack;
                R = STACK.pop();
            }
        };
        var sceneChange = function () {
            return runtime.trigger('whenSceneStarts', self.getCostumeName());
        };
        var backdropChange = function () {
            return runtime.trigger('whenBackdropChanges', self.getCostumeName());
        };
        var broadcast = function (name) {
            return runtime.trigger('whenIReceive', name);
        };
        var running = function (bases) {
            for (var j = 0; j < runtime.queue.length; j++) {
                if (runtime.queue[j] && bases.indexOf(runtime.queue[j].base) !== -1)
                    return true;
            }
            return false;
        };
        var queue = function (id) {
            if (WARP) {
                IMMEDIATE = S.fns[id];
            }
            else {
                forceQueue(id);
            }
        };
        var forceQueue = function (id) {
            runtime.queue[THREAD] = new Thread(S, BASE, S.fns[id], CALLS);
        };
        class Thread {
            constructor(sprite, base, fn, calls) {
                this.sprite = sprite;
                this.base = base;
                this.fn = fn;
                this.calls = calls;
            }
        }
        class Runtime {
            constructor(stage) {
                this.stage = stage;
                this.queue = [];
                this.isRunning = false;
                this.timerStart = 0;
                this.baseTime = 0;
                this.baseNow = 0;
                this.now = 0;
                this.isTurbo = false;
                this.framerate = 30;
                this.playingSounds = 0;
                this.stopSounds = 0;
                // Fix scoping
                this.onError = this.onError.bind(this);
                this.step = this.step.bind(this);
            }
            startThread(sprite, base) {
                const thread = new Thread(sprite, base, base, [{
                        args: [],
                        stack: [{}],
                    }]);
                // Replace an existing thread instead of adding a new one when possible.
                for (let i = 0; i < this.queue.length; i++) {
                    const q = this.queue[i];
                    if (q && q.sprite === sprite && q.base === base) {
                        this.queue[i] = thread;
                        return;
                    }
                }
                this.queue.push(thread);
            }
            /**
             * Triggers an event for a single sprite.
             */
            triggerFor(sprite, event, arg) {
                let threads;
                switch (event) {
                    case 'whenClicked':
                        threads = sprite.listeners.whenClicked;
                        break;
                    case 'whenCloned':
                        threads = sprite.listeners.whenCloned;
                        break;
                    case 'whenGreenFlag':
                        threads = sprite.listeners.whenGreenFlag;
                        break;
                    case 'whenKeyPressed':
                        threads = sprite.listeners.whenKeyPressed[arg];
                        break;
                    case 'whenSceneStarts':
                        threads = sprite.listeners.whenSceneStarts[('' + arg).toLowerCase()];
                        break;
                    case 'whenBackdropChanges':
                        threads = sprite.listeners.whenBackdropChanges['' + arg];
                        break;
                    case 'whenIReceive':
                        arg = '' + arg;
                        // TODO: remove toLowerCase() check?
                        threads = sprite.listeners.whenIReceive[arg] || sprite.listeners.whenIReceive[arg.toLowerCase()];
                        break;
                    default: throw new Error('Unknown trigger event: ' + event);
                }
                if (threads) {
                    for (let i = 0; i < threads.length; i++) {
                        this.startThread(sprite, threads[i]);
                    }
                }
                return threads || [];
            }
            /**
             * Triggers an event on all sprites.
             */
            trigger(event, arg) {
                let threads = [];
                for (let i = this.stage.children.length; i--;) {
                    threads = threads.concat(this.triggerFor(this.stage.children[i], event, arg));
                }
                return threads.concat(this.triggerFor(this.stage, event, arg));
            }
            /**
             * Trigger's the project's green flag.
             */
            triggerGreenFlag() {
                this.timerStart = this.rightNow();
                this.trigger('whenGreenFlag');
            }
            /**
             * Begins the runtime's event loop.
             * Does not start any scripts.
             */
            start() {
                this.isRunning = true;
                if (this.interval)
                    return;
                window.addEventListener('error', this.onError);
                this.baseTime = Date.now();
                this.interval = setInterval(this.step, 1000 / this.framerate);
                if (audioContext)
                    audioContext.resume();
            }
            /**
             * Pauses the event loop
             */
            pause() {
                if (this.interval) {
                    this.baseNow = this.rightNow();
                    clearInterval(this.interval);
                    this.interval = 0;
                    window.removeEventListener('error', this.onError);
                    if (audioContext)
                        audioContext.suspend();
                }
                this.isRunning = false;
            }
            /**
             * Resets the interval loop without the effects of pausing/starting
             */
            resetInterval() {
                if (!this.isRunning) {
                    throw new Error('cannot restart interval when paused');
                }
                if (this.interval) {
                    clearInterval(this.interval);
                }
                this.interval = setInterval(this.step, 1000 / this.framerate);
            }
            stopAll() {
                this.stage.hidePrompt = false;
                this.stage.prompter.style.display = 'none';
                this.stage.promptId = this.stage.nextPromptId = 0;
                this.queue.length = 0;
                this.stage.resetFilters();
                this.stage.stopSounds();
                for (var i = 0; i < this.stage.children.length; i++) {
                    const c = this.stage.children[i];
                    if (c.isClone) {
                        c.remove();
                        this.stage.children.splice(i, 1);
                        i -= 1;
                    }
                    else {
                        c.resetFilters();
                        if (c.saying && P.core.isSprite(c))
                            c.say('');
                        c.stopSounds();
                    }
                }
            }
            /**
             * The current time in the project
             */
            rightNow() {
                return this.baseNow + Date.now() - this.baseTime;
            }
            /**
             * Advances one frame into the future.
             */
            step() {
                // Reset runtime variables
                self = this.stage;
                runtime = this;
                VISUAL = false;
                if (audioContext && audioContext.state === 'suspended') {
                    audioContext.resume();
                }
                const start = Date.now();
                const queue = this.queue;
                do {
                    this.now = this.rightNow();
                    for (THREAD = 0; THREAD < queue.length; THREAD++) {
                        const thread = queue[THREAD];
                        if (thread) {
                            // Load thread data
                            S = thread.sprite;
                            IMMEDIATE = thread.fn;
                            BASE = thread.base;
                            CALLS = thread.calls;
                            C = CALLS.pop();
                            STACK = C.stack;
                            R = STACK.pop();
                            queue[THREAD] = undefined;
                            WARP = 0;
                            while (IMMEDIATE) {
                                const fn = IMMEDIATE;
                                IMMEDIATE = null;
                                fn();
                            }
                            STACK.push(R);
                            CALLS.push(C);
                        }
                    }
                    // Remove empty elements in the queue list
                    for (let i = queue.length; i--;) {
                        if (!queue[i]) {
                            queue.splice(i, 1);
                        }
                    }
                } while ((this.isTurbo || !VISUAL) && Date.now() - start < 1000 / this.framerate && queue.length);
                this.stage.draw();
            }
            onError(e) {
                clearInterval(this.interval);
                this.handleError(e.error);
            }
            handleError(e) {
                // Default error handler
                console.error(e);
            }
        }
        runtime_1.Runtime = Runtime;
        // Very dirty temporary hack to get a crashmonitor installed w/o affecting performance
        if (P.config.useCrashMonitor) {
            Runtime.prototype.step = function () {
                // Reset runtime variables
                self = this.stage;
                runtime = this;
                VISUAL = false;
                if (audioContext && audioContext.state === 'suspended') {
                    audioContext.resume();
                }
                const start = Date.now();
                const queue = this.queue;
                do {
                    this.now = this.rightNow();
                    for (THREAD = 0; THREAD < queue.length; THREAD++) {
                        const thread = queue[THREAD];
                        if (thread) {
                            // Load thread data
                            S = thread.sprite;
                            IMMEDIATE = thread.fn;
                            BASE = thread.base;
                            CALLS = thread.calls;
                            C = CALLS.pop();
                            STACK = C.stack;
                            R = STACK.pop();
                            queue[THREAD] = undefined;
                            WARP = 0;
                            while (IMMEDIATE) {
                                if (Date.now() - start > 5000) {
                                    const el = document.createElement('pre');
                                    el.textContent += 'crash monitor debug:\n';
                                    el.textContent += `S: ${S.name} (isClone=${S.isClone},isStage=${S.isStage})\n`;
                                    el.textContent += `IMMEDIATE: ${IMMEDIATE.toString()} // (${S.fns.indexOf(IMMEDIATE)})\n`;
                                    document.querySelector('#app').appendChild(el);
                                    alert('forkphorus has crashed. please include the debug information at the bottom of the page.');
                                    this.pause();
                                    this.stopAll();
                                    return;
                                }
                                const fn = IMMEDIATE;
                                IMMEDIATE = null;
                                fn();
                            }
                            STACK.push(R);
                            CALLS.push(C);
                        }
                    }
                    // Remove empty elements in the queue list
                    for (let i = queue.length; i--;) {
                        if (!queue[i]) {
                            queue.splice(i, 1);
                        }
                    }
                } while ((this.isTurbo || !VISUAL) && Date.now() - start < 1000 / this.framerate && queue.length);
                this.stage.draw();
            };
        }
        function createContinuation(source) {
            // TODO: make understandable
            var result = '(function() {\n';
            var brackets = 0;
            var delBrackets = 0;
            var shouldDelete = false;
            var here = 0;
            var length = source.length;
            while (here < length) {
                var i = source.indexOf('{', here);
                var j = source.indexOf('}', here);
                var k = source.indexOf('return;', here);
                if (k === -1)
                    k = length;
                if (i === -1 && j === -1) {
                    if (!shouldDelete) {
                        result += source.slice(here, k);
                    }
                    break;
                }
                if (i === -1)
                    i = length;
                if (j === -1)
                    j = length;
                if (shouldDelete) {
                    if (i < j) {
                        delBrackets++;
                        here = i + 1;
                    }
                    else {
                        delBrackets--;
                        if (!delBrackets) {
                            shouldDelete = false;
                        }
                        here = j + 1;
                    }
                }
                else {
                    if (brackets === 0 && k < i && k < j) {
                        result += source.slice(here, k);
                        break;
                    }
                    if (i < j) {
                        result += source.slice(here, i + 1);
                        brackets++;
                        here = i + 1;
                    }
                    else {
                        result += source.slice(here, j);
                        here = j + 1;
                        if (source.substr(j, 8) === '} else {') {
                            if (brackets > 0) {
                                result += '} else {';
                                here = j + 8;
                            }
                            else {
                                shouldDelete = true;
                                delBrackets = 0;
                            }
                        }
                        else {
                            if (brackets > 0) {
                                result += '}';
                                brackets--;
                            }
                        }
                    }
                }
            }
            result += '})';
            return scopedEval(result);
        }
        runtime_1.createContinuation = createContinuation;
        // Evaluate JavaScript within the scope of the runtime.
        function scopedEval(source) {
            return eval(source);
        }
        runtime_1.scopedEval = scopedEval;
    })(runtime = P.runtime || (P.runtime = {}));
})(P || (P = {}));
/// <reference path="phosphorus.ts" />
var P;
(function (P) {
    var utils;
    (function (utils) {
        // Returns the string representation of an error.
        // TODO: does this need to be here?
        function stringifyError(error) {
            if (!error) {
                return 'unknown error';
            }
            if (error.stack) {
                return 'Message: ' + error.message + '\nStack:\n' + error.stack;
            }
            return error.toString();
        }
        utils.stringifyError = stringifyError;
        /**
         * Parses a Scratch rotation style string to a RotationStyle enum
         */
        function parseRotationStyle(style) {
            switch (style) {
                case 'leftRight':
                case 'left-right':
                    return 1 /* LeftRight */;
                case 'none':
                case 'don\'t rotate':
                    return 2 /* None */;
                case 'normal':
                case 'all around':
                    return 0 /* Normal */;
            }
            console.warn('unknown rotation style', style);
            return 0 /* Normal */;
        }
        utils.parseRotationStyle = parseRotationStyle;
        // Determines the type of a project with its project.json data
        function projectType(data) {
            if (typeof data !== 'object' || data === null) {
                return null;
            }
            if ('targets' in data) {
                return 3;
            }
            if ('objName' in data) {
                return 2;
            }
            return null;
        }
        utils.projectType = projectType;
        /**
         * Converts an RGB color to an HSL color
         * @param rgb RGB Color
         */
        function rgbToHSL(rgb) {
            var r = (rgb >> 16 & 0xff) / 0xff;
            var g = (rgb >> 8 & 0xff) / 0xff;
            var b = (rgb & 0xff) / 0xff;
            var min = Math.min(r, g, b);
            var max = Math.max(r, g, b);
            if (min === max) {
                return [0, 0, r * 100];
            }
            var c = max - min;
            var l = (min + max) / 2;
            var s = c / (1 - Math.abs(2 * l - 1));
            var h;
            switch (max) {
                case r:
                    h = ((g - b) / c + 6) % 6;
                    break;
                case g:
                    h = (b - r) / c + 2;
                    break;
                case b:
                    h = (r - g) / c + 4;
                    break;
            }
            h *= 60;
            return [h, s * 100, l * 100];
        }
        utils.rgbToHSL = rgbToHSL;
        /**
         * Clamps a number within a range
         * @param number The number
         * @param min Minimum, inclusive
         * @param max Maximum, inclusive
         */
        function clamp(number, min, max) {
            return Math.min(max, Math.max(min, number));
        }
        utils.clamp = clamp;
        /*
         * Creates a promise that resolves when the original promise resolves or fails.
         */
        function settled(promise) {
            return new Promise((resolve, _reject) => {
                promise
                    .then(() => resolve())
                    .catch(() => resolve());
            });
        }
        utils.settled = settled;
    })(utils = P.utils || (P.utils = {}));
})(P || (P = {}));
/// <reference path="phosphorus.ts" />
/// <reference path="utils.ts" />
/// <reference path="core.ts" />
/// <reference path="fonts.ts" />
/// <reference path="config.ts" />
var P;
(function (P) {
    var sb2;
    (function (sb2) {
        const ASSET_URL = 'https://cdn.assets.scratch.mit.edu/internalapi/asset/';
        let zipArchive;
        class Scratch2VariableWatcher extends P.core.Watcher {
            constructor(stage, targetName, data) {
                super(stage, targetName);
                this.cmd = data.cmd;
                this.type = data.type || 'var';
                if (data.color) {
                    var c = (data.color < 0 ? data.color + 0x1000000 : data.color).toString(16);
                    this.color = '#000000'.slice(0, -c.length) + c;
                }
                else {
                    this.color = '#ee7d16';
                }
                this.isDiscrete = data.isDiscrete == null ? true : data.isDiscrete;
                this.label = data.label || '';
                this.mode = data.mode || 1;
                this.param = data.param;
                this.sliderMax = data.sliderMax == null ? 100 : data.sliderMax;
                this.sliderMin = data.sliderMin || 0;
                this.targetName = data.target;
                this.visible = data.visible == null ? false : data.visible;
                this.x = data.x || 0;
                this.y = data.y || 0;
            }
            init() {
                super.init();
                if (this.target && this.cmd === 'getVar:') {
                    this.target.watchers[this.param] = this;
                }
                if (!this.label) {
                    this.label = this.getLabel();
                    if (this.target.isSprite)
                        this.label = this.target.name + ': ' + this.label;
                }
                this.layout();
            }
            getLabel() {
                var WATCHER_LABELS = {
                    'costumeIndex': 'costume #',
                    'xpos': 'x position',
                    'ypos': 'y position',
                    'heading': 'direction',
                    'scale': 'size',
                    'backgroundIndex': 'background #',
                    'sceneName': 'background name',
                    'tempo': 'tempo',
                    'volume': 'volume',
                    'answer': 'answer',
                    'timer': 'timer',
                    'soundLevel': 'loudness',
                    'isLoud': 'loud?',
                    'xScroll': 'x scroll',
                    'yScroll': 'y scroll'
                };
                switch (this.cmd) {
                    case 'getVar:': return this.param;
                    case 'sensor:': return this.param + ' sensor value';
                    case 'sensorPressed': return 'sensor ' + this.param + '?';
                    case 'timeAndDate': return this.param;
                    case 'senseVideoMotion': return 'video ' + this.param;
                }
                return WATCHER_LABELS[this.cmd] || '';
            }
            setVisible(visible) {
                super.setVisible(visible);
                this.layout();
            }
            update() {
                var value = 0;
                if (!this.target)
                    return;
                switch (this.cmd) {
                    case 'answer':
                        value = this.stage.answer;
                        break;
                    case 'backgroundIndex':
                        value = this.stage.currentCostumeIndex + 1;
                        break;
                    case 'costumeIndex':
                        value = this.target.currentCostumeIndex + 1;
                        break;
                    case 'getVar:':
                        value = this.target.vars[this.param];
                        break;
                    case 'heading':
                        value = this.target.direction;
                        break;
                    case 'scale':
                        if (this.target.isSprite) {
                            value = this.target.scale * 100;
                        }
                        break;
                    case 'sceneName':
                        value = this.stage.getCostumeName();
                        break;
                    case 'senseVideoMotion':
                        // TODO
                        break;
                    case 'soundLevel':
                        // TODO
                        break;
                    case 'tempo':
                        value = this.stage.tempoBPM;
                        break;
                    case 'timeAndDate':
                        value = this.timeAndDate(this.param);
                        break;
                    case 'timer':
                        value = Math.round((this.stage.runtime.rightNow() - this.stage.runtime.timerStart) / 100) / 10;
                        break;
                    case 'volume':
                        value = this.target.volume * 100;
                        break;
                    case 'xpos':
                        value = this.target.scratchX;
                        break;
                    case 'ypos':
                        value = this.target.scratchY;
                        break;
                }
                if (typeof value === 'number' && (value < 0.001 || value > 0.001)) {
                    value = Math.round(value * 1000) / 1000;
                }
                this.readout.textContent = '' + value;
                if (this.slider) {
                    this.buttonWrap.style.transform = 'translate(' + ((+value || 0) - this.sliderMin) / (this.sliderMax - this.sliderMin) * 100 + '%,0)';
                }
            }
            timeAndDate(format) {
                switch (format) {
                    case 'year':
                        return new Date().getFullYear();
                    case 'month':
                        return new Date().getMonth() + 1;
                    case 'date':
                        return new Date().getDate();
                    case 'day of week':
                        return new Date().getDay() + 1;
                    case 'hour':
                        return new Date().getHours();
                    case 'minute':
                        return new Date().getMinutes();
                    case 'second':
                        return new Date().getSeconds();
                }
                return 0;
            }
            layout() {
                if (this.el) {
                    this.el.style.display = this.visible ? 'block' : 'none';
                    return;
                }
                if (!this.visible)
                    return;
                this.el = document.createElement('div');
                this.el.dataset.watcher = '' + this.stage.allWatchers.indexOf(this);
                this.el.style.whiteSpace = 'pre';
                this.el.style.position = 'absolute';
                this.el.style.left = this.el.style.top = '0';
                this.el.style.transform = 'translate(' + (this.x | 0) / 10 + 'em,' + (this.y | 0) / 10 + 'em)';
                this.el.style.cursor = 'default';
                if (this.mode === 2) {
                    this.el.appendChild(this.readout = document.createElement('div'));
                    this.readout.style.minWidth = (38 / 15) + 'em';
                    this.readout.style.font = 'bold 1.5em/' + (19 / 15) + ' sans-serif';
                    this.readout.style.height = (19 / 15) + 'em';
                    this.readout.style.borderRadius = (4 / 15) + 'em';
                    this.readout.style.margin = (3 / 15) + 'em 0 0 0';
                    this.readout.style.padding = '0 ' + (3 / 10) + 'em';
                }
                else {
                    this.el.appendChild(this.labelEl = document.createElement('div'));
                    this.el.appendChild(this.readout = document.createElement('div'));
                    this.el.style.border = '.1em solid rgb(148,145,145)';
                    this.el.style.borderRadius = '.4em';
                    this.el.style.background = 'rgb(193,196,199)';
                    this.el.style.padding = '.2em .6em .3em .5em';
                    this.labelEl.textContent = this.label;
                    // this.labelEl.style.marginTop = (1/11)+'em';
                    this.labelEl.style.font = 'bold 1.1em/1 sans-serif';
                    this.labelEl.style.display = 'inline-block';
                    this.labelEl.style.verticalAlign =
                        this.readout.style.verticalAlign = 'middle';
                    this.readout.style.minWidth = (37 / 10) + 'em';
                    this.readout.style.padding = '0 ' + (1 / 10) + 'em';
                    this.readout.style.font = 'bold 1.0em/' + (13 / 10) + ' sans-serif';
                    this.readout.style.height = (13 / 10) + 'em';
                    this.readout.style.borderRadius = (4 / 10) + 'em';
                    this.readout.style.marginLeft = (6 / 10) + 'em';
                }
                this.readout.style.color = '#fff';
                var f = 1 / (this.mode === 2 ? 15 : 10);
                this.readout.style.border = f + 'em solid #fff';
                this.readout.style.boxShadow = 'inset ' + f + 'em ' + f + 'em ' + f + 'em rgba(0,0,0,.5), inset -' + f + 'em -' + f + 'em ' + f + 'em rgba(255,255,255,.5)';
                this.readout.style.textAlign = 'center';
                this.readout.style.background = this.color;
                this.readout.style.display = 'inline-block';
                if (this.mode === 3) {
                    this.el.appendChild(this.slider = document.createElement('div'));
                    this.slider.appendChild(this.buttonWrap = document.createElement('div'));
                    this.buttonWrap.appendChild(this.button = document.createElement('div'));
                    this.slider.style.height =
                        this.slider.style.borderRadius = '.5em';
                    this.slider.style.background = 'rgb(192,192,192)';
                    this.slider.style.margin = '.4em 0 .1em';
                    this.slider.style.boxShadow = 'inset .125em .125em .125em rgba(0,0,0,.5), inset -.125em -.125em .125em rgba(255,255,255,.5)';
                    this.slider.style.position = 'relative';
                    this.slider.style.pointerEvents = 'auto';
                    this.slider.dataset.slider = '';
                    this.slider.style.paddingRight =
                        this.button.style.width =
                            this.button.style.height =
                                this.button.style.borderRadius = '1.1em';
                    this.button.style.position = 'absolute';
                    this.button.style.left = '0';
                    this.button.style.top = '-.3em';
                    this.button.style.background = '#fff';
                    this.button.style.boxShadow = 'inset .3em .3em .2em -.2em rgba(255,255,255,.9), inset -.3em -.3em .2em -.2em rgba(0,0,0,.9), inset 0 0 0 .1em #777';
                    this.button.dataset.button = '';
                }
                this.stage.ui.appendChild(this.el);
            }
        }
        sb2.Scratch2VariableWatcher = Scratch2VariableWatcher;
        class Scratch2Stage extends P.core.Stage {
            constructor() {
                super(...arguments);
                this.dragging = {};
                this.defaultWatcherX = 10;
                this.defaultWatcherY = 10;
            }
            lookupVariable(name) {
                return this.vars[name];
            }
            createVariableWatcher(target, variableName) {
                const x = this.defaultWatcherX;
                const y = this.defaultWatcherY;
                this.defaultWatcherY += 26;
                if (this.defaultWatcherY >= 450) {
                    this.defaultWatcherY = 10;
                    this.defaultWatcherX += 150;
                }
                return new P.sb2.Scratch2VariableWatcher(this, target.name, {
                    cmd: 'getVar:',
                    param: variableName,
                    x,
                    y,
                });
            }
            say(text, thinking) {
                // Stage cannot say things in Scratch 2.
                return ++this.sayId;
            }
            updateBubble() {
                // Stage cannot say things in Scratch 2.
            }
            watcherStart(id, t, e) {
                var p = e.target;
                while (p && p.dataset.watcher == null)
                    p = p.parentElement;
                if (!p)
                    return;
                var w = this.allWatchers[p.dataset.watcher];
                this.dragging[id] = {
                    watcher: w,
                    offset: (e.target.dataset.button == null ? -w.button.offsetWidth / 2 | 0 : w.button.getBoundingClientRect().left - t.clientX) - w.slider.getBoundingClientRect().left
                };
            }
            watcherMove(id, t, e) {
                var d = this.dragging[id];
                if (!d)
                    return;
                var w = d.watcher;
                var sw = w.slider.offsetWidth;
                var bw = w.button.offsetWidth;
                var value = w.sliderMin + Math.max(0, Math.min(1, (t.clientX + d.offset) / (sw - bw))) * (w.sliderMax - w.sliderMin);
                w.target.vars[w.param] = w.isDiscrete ? Math.round(value) : Math.round(value * 100) / 100;
                w.update();
                e.preventDefault();
            }
            watcherEnd(id, t, e) {
                this.watcherMove(id, t, e);
                delete this.dragging[id];
            }
            ontouch(event, touch) {
                const target = event.target;
                if (target.dataset.button != null || target.dataset.slider != null) {
                    this.watcherStart(touch.identifier, touch, event);
                }
            }
            onmousedown(e) {
                const target = e.target;
                if (target.dataset.button != null || target.dataset.slider != null) {
                    this.watcherStart('mouse', e, e);
                }
            }
            onmousemove(e) {
                this.watcherMove('mouse', e, e);
            }
            onmouseup(e) {
                this.watcherEnd('mouse', e, e);
            }
        }
        sb2.Scratch2Stage = Scratch2Stage;
        class Scratch2Sprite extends P.core.Sprite {
            lookupVariable(name) {
                return this.vars[name];
            }
            _clone() {
                return new Scratch2Sprite(this.stage);
            }
        }
        sb2.Scratch2Sprite = Scratch2Sprite;
        // loads an image from a URL
        function loadImage(url) {
            P.IO.progressHooks.new();
            var image = new Image();
            image.crossOrigin = 'anonymous';
            return new Promise((resolve, reject) => {
                image.onload = function () {
                    P.IO.progressHooks.end();
                    resolve(image);
                };
                image.onerror = function (err) {
                    reject('Failed to load image: ' + image.src);
                };
                image.src = url;
            });
        }
        sb2.loadImage = loadImage;
        // Loads a .sb2 file from an ArrayBuffer containing the .sb2 file
        function loadSB2Project(arrayBuffer) {
            return JSZip.loadAsync(arrayBuffer)
                .then((zip) => {
                zipArchive = zip;
                return zip.file('project.json').async('text');
            })
                .then((text) => {
                const project = JSON.parse(text);
                return loadProject(project);
            });
        }
        sb2.loadSB2Project = loadSB2Project;
        // Loads a project on the scratch.mit.edu website from its project.json
        function loadProject(data) {
            var children;
            var stage;
            return loadFonts()
                .then(() => Promise.all([
                P.audio.loadSoundbank(),
                loadArray(data.children, loadObject).then((c) => children = c),
                loadBase(data, true).then((s) => stage = s),
            ]))
                .then(() => {
                children = children.filter((i) => i);
                children.forEach((c) => c.stage = stage);
                var sprites = children.filter((i) => i instanceof Scratch2Sprite);
                var watchers = children.filter((i) => i instanceof Scratch2VariableWatcher);
                stage.children = sprites;
                stage.allWatchers = watchers;
                stage.allWatchers.forEach((w) => w.init());
                stage.updateBackdrop();
                P.sb2.compiler.compile(stage);
                return stage;
            });
        }
        sb2.loadProject = loadProject;
        function loadBase(data, isStage = false) {
            var costumes;
            var sounds;
            return Promise.all([
                loadArray(data.costumes, loadCostume).then((c) => costumes = c),
                loadArray(data.sounds, loadSound).then((s) => sounds = s),
            ]).then(() => {
                const variables = {};
                if (data.variables) {
                    for (const variable of data.variables) {
                        if (variable.isPeristent) {
                            throw new Error('Cloud variables are not supported');
                        }
                        variables[variable.name] = variable.value;
                    }
                }
                const lists = {};
                if (data.lists) {
                    for (const list of data.lists) {
                        if (list.isPeristent) {
                            throw new Error('Cloud lists are not supported');
                        }
                        lists[list.listName] = list.contents;
                    }
                }
                // Dirty hack to construct a target with a null stage
                const object = new (isStage ? Scratch2Stage : Scratch2Sprite)(null);
                object.name = data.objName;
                object.vars = variables;
                object.lists = lists;
                object.costumes = costumes;
                object.currentCostumeIndex = data.currentCostumeIndex;
                sounds.forEach((sound) => sound && object.addSound(sound));
                if (isStage) {
                }
                else {
                    const sprite = object;
                    sprite.scratchX = data.scratchX;
                    sprite.scratchY = data.scratchY;
                    sprite.direction = data.direction;
                    sprite.isDraggable = data.isDraggable;
                    sprite.rotationStyle = P.utils.parseRotationStyle(data.rotationStyle);
                    sprite.scale = data.scale;
                    sprite.visible = data.visible;
                }
                // We store the scripts on the Sprite so the compiler can find them easier
                // TODO: to something different?
                object.scripts = data.scripts || [];
                return object;
            });
        }
        sb2.loadBase = loadBase;
        // A weird mix of Array.map and Promise.all
        function loadArray(data, process) {
            return Promise.all((data || []).map((i, ind) => process(i, ind)));
        }
        sb2.loadArray = loadArray;
        function loadFonts() {
            return Promise.all([
                P.utils.settled(P.fonts.loadWebFont('Donegal One')),
                P.utils.settled(P.fonts.loadWebFont('Gloria Hallelujah')),
                P.utils.settled(P.fonts.loadWebFont('Mystery Quest')),
                P.utils.settled(P.fonts.loadWebFont('Permanent Marker')),
                P.utils.settled(P.fonts.loadWebFont('Scratch')),
            ]).then(() => undefined);
        }
        sb2.loadFonts = loadFonts;
        function loadObject(data) {
            if (data.cmd) {
                return loadVariableWatcher(data);
            }
            else if (data.listName) {
                // TODO: list watcher
            }
            else {
                return loadBase(data);
            }
        }
        sb2.loadObject = loadObject;
        function loadVariableWatcher(data) {
            const targetName = data.target;
            const watcher = new Scratch2VariableWatcher(null, targetName, data);
            return watcher;
        }
        sb2.loadVariableWatcher = loadVariableWatcher;
        function loadCostume(data, index) {
            const promises = [
                loadMD5(data.baseLayerMD5, data.baseLayerID)
                    .then((asset) => data.$image = asset)
            ];
            if (data.textLayerMD5) {
                promises.push(loadMD5(data.textLayerMD5, data.textLayerID)
                    .then((asset) => data.$text = asset));
            }
            return Promise.all(promises)
                .then((layers) => {
                var image;
                if (layers.length > 1) {
                    image = document.createElement('canvas');
                    const ctx = image.getContext('2d');
                    image.width = Math.max(layers[0].width, 1);
                    image.height = Math.max(layers[0].height, 1);
                    for (const layer of layers) {
                        ctx.drawImage(layer, 0, 0);
                    }
                }
                else {
                    image = layers[0];
                }
                return new P.core.BitmapCostume(image, {
                    name: data.costumeName,
                    bitmapResolution: data.bitmapResolution,
                    rotationCenterX: data.rotationCenterX,
                    rotationCenterY: data.rotationCenterY,
                });
            });
        }
        sb2.loadCostume = loadCostume;
        function loadSound(data) {
            return new Promise((resolve, reject) => {
                loadMD5(data.md5, data.soundID, true)
                    .then((buffer) => {
                    resolve(new P.core.Sound({
                        name: data.soundName,
                        buffer,
                    }));
                })
                    .catch((err) => {
                    resolve(null);
                    console.warn('Could not load sound: ' + err);
                });
            });
        }
        sb2.loadSound = loadSound;
        function patchSVG(svg, element) {
            const FONTS = {
                '': 'Helvetica',
                Donegal: 'Donegal One',
                Gloria: 'Gloria Hallelujah',
                Marker: 'Permanent Marker',
                Mystery: 'Mystery Quest'
            };
            const LINE_HEIGHTS = {
                Helvetica: 1.13,
                'Donegal One': 1.25,
                'Gloria Hallelujah': 1.97,
                'Permanent Marker': 1.43,
                'Mystery Quest': 1.37
            };
            if (element.nodeType !== 1)
                return;
            if (element.nodeName === 'text') {
                // Correct fonts
                var font = element.getAttribute('font-family') || '';
                font = FONTS[font] || font;
                if (font) {
                    element.setAttribute('font-family', font);
                    if (font === 'Helvetica')
                        element.style.fontWeight = 'bold';
                }
                var size = +element.getAttribute('font-size');
                if (!size) {
                    element.setAttribute('font-size', size = 18);
                }
                var bb = element.getBBox();
                var x = 4 - .6 * element.transform.baseVal.consolidate().matrix.a;
                var y = (element.getAttribute('y') - bb.y) * 1.1;
                element.setAttribute('x', x);
                element.setAttribute('y', y);
                var lines = element.textContent.split('\n');
                if (lines.length > 1) {
                    element.textContent = lines[0];
                    var lineHeight = LINE_HEIGHTS[font] || 1;
                    for (var i = 1, l = lines.length; i < l; i++) {
                        var tspan = document.createElementNS(null, 'tspan');
                        tspan.textContent = lines[i];
                        tspan.setAttribute('x', '' + x);
                        tspan.setAttribute('y', '' + (y + size * i * lineHeight));
                        element.appendChild(tspan);
                    }
                }
            }
            else if ((element.hasAttribute('x') || element.hasAttribute('y')) && element.hasAttribute('transform')) {
                element.setAttribute('x', 0);
                element.setAttribute('y', 0);
            }
            [].forEach.call(element.childNodes, patchSVG.bind(null, svg));
        }
        sb2.patchSVG = patchSVG;
        function loadSVG(source) {
            // canvg needs and actual SVG element, not the source.
            const parser = new DOMParser();
            var doc = parser.parseFromString(source, 'image/svg+xml');
            var svg = doc.documentElement;
            if (!svg.style) {
                doc = parser.parseFromString('<body>' + source, 'text/html');
                svg = doc.querySelector('svg');
            }
            svg.style.visibility = 'hidden';
            svg.style.position = 'absolute';
            svg.style.left = '-10000px';
            svg.style.top = '-10000px';
            document.body.appendChild(svg);
            const viewBox = svg.viewBox.baseVal;
            if (viewBox && (viewBox.x || viewBox.y)) {
                svg.width.baseVal.value = viewBox.width - viewBox.x;
                svg.height.baseVal.value = viewBox.height - viewBox.y;
                viewBox.x = 0;
                viewBox.y = 0;
                viewBox.width = 0;
                viewBox.height = 0;
            }
            patchSVG(svg, svg);
            document.body.removeChild(svg);
            svg.style.visibility = svg.style.position = svg.style.left = svg.style.top = '';
            // TODO: use native renderer
            return new Promise((resolve, reject) => {
                const canvas = document.createElement('canvas');
                canvg(canvas, new XMLSerializer().serializeToString(svg), {
                    ignoreMouse: true,
                    ignoreAnimation: true,
                    ignoreClear: true,
                    renderCallback: function () {
                        if (canvas.width === 0 || canvas.height === 0) {
                            resolve(new Image());
                            return;
                        }
                        resolve(canvas);
                    }
                });
            });
        }
        sb2.loadSVG = loadSVG;
        function loadMD5(hash, id, isAudio = false) {
            if (zipArchive) {
                var f = isAudio ? zipArchive.file(id + '.wav') : zipArchive.file(id + '.gif') || zipArchive.file(id + '.png') || zipArchive.file(id + '.jpg') || zipArchive.file(id + '.svg');
                hash = f.name;
            }
            const ext = hash.split('.').pop();
            if (ext === 'svg') {
                if (zipArchive) {
                    return f.async('text')
                        .then((text) => loadSVG(text));
                }
                else {
                    return new P.IO.TextRequest(ASSET_URL + hash + '/get/').load()
                        .then((text) => loadSVG(text));
                }
            }
            else if (ext === 'wav') {
                if (zipArchive) {
                    return f.async('arrayBuffer')
                        .then((buffer) => P.audio.decodeAudio(buffer));
                }
                else {
                    return new P.IO.ArrayBufferRequest(ASSET_URL + hash + '/get/').load()
                        .then((buffer) => P.audio.decodeAudio(buffer));
                }
            }
            else {
                if (zipArchive) {
                    return new Promise((resolve, reject) => {
                        var image = new Image();
                        image.onload = function () {
                            resolve(image);
                        };
                        f.async('binarystring')
                            .then((data) => {
                            image.src = 'data:image/' + (ext === 'jpg' ? 'jpeg' : ext) + ';base64,' + btoa(data);
                        });
                    });
                }
                else {
                    return loadImage(ASSET_URL + hash + '/get/');
                }
            }
        }
        sb2.loadMD5 = loadMD5;
    })(sb2 = P.sb2 || (P.sb2 = {}));
})(P || (P = {}));
// Compiler for .sb2 projects
(function (P) {
    var sb2;
    (function (sb2) {
        var compiler;
        (function (compiler) {
            var LOG_PRIMITIVES;
            // Implements a Scratch 2 procedure.
            // Scratch 2 argument references just go by index, so its very simple.
            class Scratch2Procedure extends P.core.Procedure {
                call(inputs) {
                    return inputs;
                }
            }
            compiler.Scratch2Procedure = Scratch2Procedure;
            var EVENT_SELECTORS = [
                'procDef',
                'whenClicked',
                'whenCloned',
                'whenGreenFlag',
                'whenIReceive',
                'whenKeyPressed',
                'whenSceneStarts',
                'whenSensorGreaterThan' // TODO
            ];
            var compileScripts = function (object) {
                for (var i = 0; i < object.scripts.length; i++) {
                    compiler.compileListener(object, object.scripts[i][2]);
                }
            };
            var warnings;
            var warn = function (message) {
                warnings[message] = (warnings[message] || 0) + 1;
            };
            compiler.compileListener = function (object, script) {
                if (!script[0] || EVENT_SELECTORS.indexOf(script[0][0]) === -1)
                    return;
                var nextLabel = function () {
                    return object.fns.length + fns.length;
                };
                var label = function () {
                    var id = nextLabel();
                    fns.push(source.length);
                    visual = 0;
                    return id;
                };
                var delay = function () {
                    source += 'return;\n';
                    label();
                };
                var queue = function (id) {
                    source += 'queue(' + id + ');\n';
                    source += 'return;\n';
                };
                var forceQueue = function (id) {
                    source += 'forceQueue(' + id + ');\n';
                    source += 'return;\n';
                };
                var seq = function (script) {
                    if (!script)
                        return;
                    for (var i = 0; i < script.length; i++) {
                        compile(script[i]);
                    }
                };
                var varRef = function (name) {
                    if (typeof name !== 'string') {
                        return 'getVars(' + val(name) + ')[' + val(name) + ']';
                    }
                    var o = object.stage.vars[name] !== undefined ? 'self' : 'S';
                    return o + '.vars[' + val(name) + ']';
                };
                var listRef = function (name) {
                    if (typeof name !== 'string') {
                        return 'getLists(' + val(name) + ')[' + val(name) + ']';
                    }
                    var o = object.stage.lists[name] !== undefined ? 'self' : 'S';
                    if (o === 'S' && !object.lists[name]) {
                        object.lists[name] = [];
                    }
                    return o + '.lists[' + val(name) + ']';
                };
                var param = function (name, usenum, usebool) {
                    if (typeof name !== 'string') {
                        throw new Error('Dynamic parameters are not supported');
                    }
                    if (!inputs)
                        return '0';
                    var i = inputs.indexOf(name);
                    if (i === -1) {
                        return '0';
                    }
                    var t = types[i];
                    var kind = t === '%n' || t === '%d' || t === '%c' ? 'num' :
                        t === '%b' ? 'bool' : '';
                    if (kind === 'num' && usenum) {
                        used[i] = true;
                        return 'C.numargs[' + i + ']';
                    }
                    if (kind === 'bool' && usebool) {
                        used[i] = true;
                        return 'C.boolargs[' + i + ']';
                    }
                    var v = 'C.args[' + i + ']';
                    if (usenum)
                        return '(+' + v + ' || 0)';
                    if (usebool)
                        return 'bool(' + v + ')';
                    return v;
                };
                var val2 = function (e) {
                    var v;
                    if (e[0] === 'costumeName') {
                        return 'S.getCostumeName()';
                    }
                    else if (e[0] === 'sceneName') {
                        return 'self.getCostumeName()';
                    }
                    else if (e[0] === 'readVariable') {
                        return varRef(e[1]);
                    }
                    else if (e[0] === 'contentsOfList:') {
                        return 'contentsOfList(' + listRef(e[1]) + ')';
                    }
                    else if (e[0] === 'getLine:ofList:') {
                        return 'getLineOfList(' + listRef(e[2]) + ', ' + val(e[1]) + ')';
                    }
                    else if (e[0] === 'concatenate:with:') {
                        return '("" + ' + val(e[1]) + ' + ' + val(e[2]) + ')';
                    }
                    else if (e[0] === 'letter:of:') {
                        return '(("" + ' + val(e[2]) + ')[(' + num(e[1]) + ' | 0) - 1] || "")';
                    }
                    else if (e[0] === 'answer') { /* Sensing */
                        return 'self.answer';
                    }
                    else if (e[0] === 'getAttribute:of:') {
                        return 'attribute(' + val(e[1]) + ', ' + val(e[2]) + ')';
                    }
                    else if (e[0] === 'getUserId') {
                        return '0';
                    }
                    else if (e[0] === 'getUserName') {
                        return 'self.username';
                    }
                    else {
                        warn('Undefined val: ' + e[0]);
                    }
                };
                var val = function (e, usenum, usebool) {
                    var v;
                    if (typeof e === 'number' || typeof e === 'boolean') {
                        return '' + e;
                    }
                    else if (typeof e === 'string') {
                        return '"' + e
                            .replace(/\\/g, '\\\\')
                            .replace(/\n/g, '\\n')
                            .replace(/\r/g, '\\r')
                            .replace(/"/g, '\\"')
                            .replace(/\{/g, '\\x7b')
                            .replace(/\}/g, '\\x7d') + '"';
                    }
                    else if (e[0] === 'getParam') {
                        return param(e[1], usenum, usebool);
                    }
                    else if ((v = numval(e)) != null || (v = boolval(e)) != null) {
                        return v;
                    }
                    else {
                        v = val2(e);
                        if (usenum)
                            return '(+' + v + ' || 0)';
                        if (usebool)
                            return 'bool(' + v + ')';
                        return v;
                    }
                };
                var numval = function (e) {
                    if (e[0] === 'xpos') { /* Motion */
                        return 'S.scratchX';
                    }
                    else if (e[0] === 'ypos') {
                        return 'S.scratchY';
                    }
                    else if (e[0] === 'heading') {
                        return 'S.direction';
                    }
                    else if (e[0] === 'costumeIndex') { /* Looks */
                        return '(S.currentCostumeIndex + 1)';
                    }
                    else if (e[0] === 'backgroundIndex') {
                        return '(self.currentCostumeIndex + 1)';
                    }
                    else if (e[0] === 'scale') {
                        return '(S.scale * 100)';
                    }
                    else if (e[0] === 'volume') { /* Sound */
                        return '(S.volume * 100)';
                    }
                    else if (e[0] === 'tempo') {
                        return 'self.tempoBPM';
                    }
                    else if (e[0] === 'lineCountOfList:') { /* Data */
                        return listRef(e[1]) + '.length';
                    }
                    else if (e[0] === '+') { /* Operators */
                        return '(' + num(e[1]) + ' + ' + num(e[2]) + ' || 0)';
                    }
                    else if (e[0] === '-') {
                        return '(' + num(e[1]) + ' - ' + num(e[2]) + ' || 0)';
                    }
                    else if (e[0] === '*') {
                        return '(' + num(e[1]) + ' * ' + num(e[2]) + ' || 0)';
                    }
                    else if (e[0] === '/') {
                        return '(' + num(e[1]) + ' / ' + num(e[2]) + ' || 0)';
                    }
                    else if (e[0] === 'randomFrom:to:') {
                        return 'random(' + num(e[1]) + ', ' + num(e[2]) + ')';
                    }
                    else if (e[0] === 'abs') {
                        return 'Math.abs(' + num(e[1]) + ')';
                    }
                    else if (e[0] === 'sqrt') {
                        return 'Math.sqrt(' + num(e[1]) + ')';
                    }
                    else if (e[0] === 'stringLength:') {
                        return '("" + ' + val(e[1]) + ').length';
                    }
                    else if (e[0] === '%' || e[0] === '\\\\') {
                        return 'mod(' + num(e[1]) + ', ' + num(e[2]) + ')';
                    }
                    else if (e[0] === 'rounded') {
                        return 'Math.round(' + num(e[1]) + ')';
                    }
                    else if (e[0] === 'computeFunction:of:') {
                        if (typeof e[1] !== 'object') {
                            switch ('' + e[1]) {
                                case 'abs':
                                    return 'Math.abs(' + num(e[2]) + ')';
                                case 'floor':
                                    return 'Math.floor(' + num(e[2]) + ')';
                                case 'sqrt':
                                    return 'Math.sqrt(' + num(e[2]) + ')';
                                case 'ceiling':
                                    return 'Math.ceil(' + num(e[2]) + ')';
                                case 'cos':
                                    return 'Math.cos(' + num(e[2]) + ' * Math.PI / 180)';
                                case 'sin':
                                    return 'Math.sin(' + num(e[2]) + ' * Math.PI / 180)';
                                case 'tan':
                                    return 'Math.tan(' + num(e[2]) + ' * Math.PI / 180)';
                                case 'asin':
                                    return 'Math.asin(' + num(e[2]) + ') * 180 / Math.PI';
                                case 'acos':
                                    return 'Math.acos(' + num(e[2]) + ') * 180 / Math.PI';
                                case 'atan':
                                    return 'Math.atan(' + num(e[2]) + ') * 180 / Math.PI';
                                case 'ln':
                                    return 'Math.log(' + num(e[2]) + ')';
                                case 'log':
                                    return 'Math.log(' + num(e[2]) + ') / Math.LN10';
                                case 'e ^':
                                    return 'Math.exp(' + num(e[2]) + ')';
                                case '10 ^':
                                    return 'Math.exp(' + num(e[2]) + ' * Math.LN10)';
                            }
                            return '0';
                        }
                        return 'mathFunc(' + val(e[1]) + ', ' + num(e[2]) + ')';
                    }
                    else if (e[0] === 'mouseX') { /* Sensing */
                        return 'self.mouseX';
                    }
                    else if (e[0] === 'mouseY') {
                        return 'self.mouseY';
                    }
                    else if (e[0] === 'timer') {
                        if (P.config.preciseTimers) {
                            return '((runtime.rightNow() - runtime.timerStart) / 1000)';
                        }
                        else {
                            return '((runtime.now - runtime.timerStart) / 1000)';
                        }
                    }
                    else if (e[0] === 'distanceTo:') {
                        return 'S.distanceTo(' + val(e[1]) + ')';
                        // } else if (e[0] === 'soundLevel') {
                    }
                    else if (e[0] === 'timestamp') {
                        return '((Date.now() - epoch) / 86400000)';
                    }
                    else if (e[0] === 'timeAndDate') {
                        return 'timeAndDate(' + val(e[1]) + ')';
                        // } else if (e[0] === 'sensor:') {
                    }
                };
                var DIGIT = /\d/;
                var boolval = function (e) {
                    if (e[0] === 'list:contains:') { /* Data */
                        return 'listContains(' + listRef(e[1]) + ', ' + val(e[2]) + ')';
                    }
                    else if (e[0] === '<' || e[0] === '>') { /* Operators */
                        var less;
                        var x;
                        var y;
                        if (typeof e[1] === 'string' && DIGIT.test(e[1]) || typeof e[1] === 'number') {
                            less = e[0] === '<';
                            x = e[1];
                            y = e[2];
                        }
                        else if (typeof e[2] === 'string' && DIGIT.test(e[2]) || typeof e[2] === 'number') {
                            less = e[0] === '>';
                            x = e[2];
                            y = e[1];
                        }
                        var nx = +x;
                        if (x == null || nx !== nx) {
                            return '(compare(' + val(e[1]) + ', ' + val(e[2]) + ') === ' + (e[0] === '<' ? -1 : 1) + ')';
                        }
                        return (less ? 'numLess' : 'numGreater') + '(' + nx + ', ' + val(y) + ')';
                    }
                    else if (e[0] === '=') {
                        if (typeof e[1] === 'string' && DIGIT.test(e[1]) || typeof e[1] === 'number') {
                            var x = e[1];
                            var y = e[2];
                        }
                        else if (typeof e[2] === 'string' && DIGIT.test(e[2]) || typeof e[2] === 'number') {
                            var x = e[2];
                            var y = e[1];
                        }
                        var nx = +x;
                        if (x == null || nx !== nx) {
                            return '(equal(' + val(e[1]) + ', ' + val(e[2]) + '))';
                        }
                        return '(numEqual(' + nx + ', ' + val(y) + '))';
                    }
                    else if (e[0] === '&') {
                        return '(' + bool(e[1]) + ' && ' + bool(e[2]) + ')';
                    }
                    else if (e[0] === '|') {
                        return '(' + bool(e[1]) + ' || ' + bool(e[2]) + ')';
                    }
                    else if (e[0] === 'not') {
                        return '!' + bool(e[1]) + '';
                    }
                    else if (e[0] === 'mousePressed') { /* Sensing */
                        return 'self.mousePressed';
                    }
                    else if (e[0] === 'touching:') {
                        return 'S.touching(' + val(e[1]) + ')';
                    }
                    else if (e[0] === 'touchingColor:') {
                        return 'S.touchingColor(' + val(e[1]) + ')';
                    }
                    else if (e[0] === 'color:sees:') {
                        return 'S.colorTouchingColor(' + val(e[1]) + ', ' + val(e[2]) + ')';
                    }
                    else if (e[0] === 'keyPressed:') {
                        var v = typeof e[1] === 'object' ?
                            'getKeyCode(' + val(e[1]) + ')' : val(P.runtime.getKeyCode(e[1]));
                        return '!!self.keys[' + v + ']';
                        // } else if (e[0] === 'isLoud') {
                        // } else if (e[0] === 'sensorPressed:') {
                    }
                };
                var bool = function (e) {
                    if (typeof e === 'boolean') {
                        return e;
                    }
                    if (typeof e === 'number' || typeof e === 'string') {
                        return +e !== 0 && e !== '' && e !== 'false';
                    }
                    var v = boolval(e);
                    return v != null ? v : val(e, false, true);
                };
                var num = function (e) {
                    if (typeof e === 'number') {
                        return e || 0;
                    }
                    if (typeof e === 'boolean' || typeof e === 'string') {
                        return +e || 0;
                    }
                    var v = numval(e);
                    return v != null ? v : val(e, true);
                };
                var beatHead = function (dur) {
                    source += 'save();\n';
                    source += 'R.start = runtime.now;\n';
                    source += 'R.duration = ' + num(dur) + ' * 60 / self.tempoBPM;\n';
                    source += 'var first = true;\n';
                };
                var beatTail = function () {
                    var id = label();
                    source += 'if (runtime.now - R.start < R.duration * 1000 || first) {\n';
                    source += '  var first;\n';
                    forceQueue(id);
                    source += '}\n';
                    source += 'restore();\n';
                };
                var wait = function (dur) {
                    source += 'save();\n';
                    source += 'R.start = runtime.now;\n';
                    source += 'R.duration = ' + dur + ';\n';
                    source += 'var first = true;\n';
                    var id = label();
                    source += 'if (runtime.now - R.start < R.duration * 1000 || first) {\n';
                    source += '  var first;\n';
                    forceQueue(id);
                    source += '}\n';
                    source += 'restore();\n';
                };
                var noRGB = '';
                noRGB += 'if (S.penCSS) {\n';
                noRGB += '  var hsl = rgb2hsl(S.penColor & 0xffffff);\n';
                noRGB += '  S.penHue = hsl[0];\n';
                noRGB += '  S.penSaturation = hsl[1];\n';
                noRGB += '  S.penLightness = hsl[2];\n';
                noRGB += '  S.penCSS = null;';
                noRGB += '}\n';
                var visual = 0;
                var compile = function (block) {
                    if (LOG_PRIMITIVES) {
                        source += 'console.log(' + val(block[0]) + ');\n';
                    }
                    if (['turnRight:', 'turnLeft:', 'heading:', 'pointTowards:', 'setRotationStyle', 'lookLike:', 'nextCostume', 'say:duration:elapsed:from:', 'say:', 'think:duration:elapsed:from:', 'think:', 'changeGraphicEffect:by:', 'setGraphicEffect:to:', 'filterReset', 'changeSizeBy:', 'setSizeTo:', 'comeToFront', 'goBackByLayers:'].indexOf(block[0]) !== -1) {
                        if (visual < 2) {
                            source += 'if (S.visible) VISUAL = true;\n';
                            visual = 2;
                        }
                        else if (P.config.debug)
                            source += '/* visual: 2 */\n';
                    }
                    else if (['forward:', 'gotoX:y:', 'gotoSpriteOrMouse:', 'changeXposBy:', 'xpos:', 'changeYposBy:', 'ypos:', 'bounceOffEdge', 'glideSecs:toX:y:elapsed:from:'].indexOf(block[0]) !== -1) {
                        if (visual < 1) {
                            source += 'if (S.visible || S.isPenDown) VISUAL = true;\n';
                            visual = 1;
                        }
                        else if (P.config.debug)
                            source += '/* visual: 1 */\n';
                    }
                    else if (['showBackground:', 'startScene', 'nextBackground', 'nextScene', 'startSceneAndWait', 'show', 'hide', 'putPenDown', 'stampCostume', 'showVariable:', 'hideVariable:', 'doAsk', 'setVolumeTo:', 'changeVolumeBy:', 'setTempoTo:', 'changeTempoBy:'].indexOf(block[0]) !== -1) {
                        if (visual < 3) {
                            source += 'VISUAL = true;\n';
                            visual = 3;
                        }
                        else if (P.config.debug)
                            source += '/* visual: 3 */\n';
                    }
                    if (block[0] === 'forward:') { /* Motion */
                        source += 'S.forward(' + num(block[1]) + ');\n';
                    }
                    else if (block[0] === 'turnRight:') {
                        source += 'S.setDirection(S.direction + ' + num(block[1]) + ');\n';
                    }
                    else if (block[0] === 'turnLeft:') {
                        source += 'S.setDirection(S.direction - ' + num(block[1]) + ');\n';
                    }
                    else if (block[0] === 'heading:') {
                        source += 'S.setDirection(' + num(block[1]) + ');\n';
                    }
                    else if (block[0] === 'pointTowards:') {
                        source += 'S.pointTowards(' + val(block[1]) + ');\n';
                    }
                    else if (block[0] === 'gotoX:y:') {
                        source += 'S.moveTo(' + num(block[1]) + ', ' + num(block[2]) + ');\n';
                    }
                    else if (block[0] === 'gotoSpriteOrMouse:') {
                        source += 'S.gotoObject(' + val(block[1]) + ');\n';
                    }
                    else if (block[0] === 'changeXposBy:') {
                        source += 'S.moveTo(S.scratchX + ' + num(block[1]) + ', S.scratchY);\n';
                    }
                    else if (block[0] === 'xpos:') {
                        source += 'S.moveTo(' + num(block[1]) + ', S.scratchY);\n';
                    }
                    else if (block[0] === 'changeYposBy:') {
                        source += 'S.moveTo(S.scratchX, S.scratchY + ' + num(block[1]) + ');\n';
                    }
                    else if (block[0] === 'ypos:') {
                        source += 'S.moveTo(S.scratchX, ' + num(block[1]) + ');\n';
                    }
                    else if (block[0] === 'bounceOffEdge') {
                        source += 'S.bounceOffEdge();\n';
                    }
                    else if (block[0] === 'setRotationStyle') {
                        source += 'S.rotationStyle = P.utils.parseRotationStyle(' + val(block[1]) + ');\n';
                    }
                    else if (block[0] === 'lookLike:') { /* Looks */
                        source += 'S.setCostume(' + val(block[1]) + ');\n';
                    }
                    else if (block[0] === 'nextCostume') {
                        source += 'S.showNextCostume();\n';
                    }
                    else if (block[0] === 'showBackground:' ||
                        block[0] === 'startScene') {
                        source += 'self.setCostume(' + val(block[1]) + ');\n';
                        source += 'var threads = sceneChange();\n';
                        source += 'if (threads.indexOf(BASE) !== -1) {return;}\n';
                    }
                    else if (block[0] === 'nextBackground' ||
                        block[0] === 'nextScene') {
                        source += 'S.showNextCostume();\n';
                        source += 'var threads = sceneChange();\n';
                        source += 'if (threads.indexOf(BASE) !== -1) {return;}\n';
                    }
                    else if (block[0] === 'startSceneAndWait') {
                        source += 'save();\n';
                        source += 'self.setCostume(' + val(block[1]) + ');\n';
                        source += 'R.threads = sceneChange();\n';
                        source += 'if (R.threads.indexOf(BASE) !== -1) {return;}\n';
                        var id = label();
                        source += 'if (!running(R.threads)) {\n';
                        forceQueue(id);
                        source += '}\n';
                        source += 'restore();\n';
                    }
                    else if (block[0] === 'say:duration:elapsed:from:') {
                        source += 'save();\n';
                        source += 'R.id = S.say(' + val(block[1]) + ', false);\n';
                        source += 'R.start = runtime.now;\n';
                        source += 'R.duration = ' + num(block[2]) + ';\n';
                        var id = label();
                        source += 'if (runtime.now - R.start < R.duration * 1000) {\n';
                        forceQueue(id);
                        source += '}\n';
                        source += 'if (S.sayId === R.id) {\n';
                        source += '  S.say("");\n';
                        source += '}\n';
                        source += 'restore();\n';
                    }
                    else if (block[0] === 'say:') {
                        source += 'S.say(' + val(block[1]) + ', false);\n';
                    }
                    else if (block[0] === 'think:duration:elapsed:from:') {
                        source += 'save();\n';
                        source += 'R.id = S.say(' + val(block[1]) + ', true);\n';
                        source += 'R.start = runtime.now;\n';
                        source += 'R.duration = ' + num(block[2]) + ';\n';
                        var id = label();
                        source += 'if (runtime.now - R.start < R.duration * 1000) {\n';
                        forceQueue(id);
                        source += '}\n';
                        source += 'if (S.sayId === R.id) {\n';
                        source += '  S.say("");\n';
                        source += '}\n';
                        source += 'restore();\n';
                    }
                    else if (block[0] === 'think:') {
                        source += 'S.say(' + val(block[1]) + ', true);\n';
                    }
                    else if (block[0] === 'changeGraphicEffect:by:') {
                        source += 'S.changeFilter(' + val(block[1]) + ', ' + num(block[2]) + ');\n';
                    }
                    else if (block[0] === 'setGraphicEffect:to:') {
                        source += 'S.setFilter(' + val(block[1]) + ', ' + num(block[2]) + ');\n';
                    }
                    else if (block[0] === 'filterReset') {
                        source += 'S.resetFilters();\n';
                    }
                    else if (block[0] === 'changeSizeBy:') {
                        source += 'var f = S.scale + ' + num(block[1]) + ' / 100;\n';
                        source += 'S.scale = f < 0 ? 0 : f;\n';
                    }
                    else if (block[0] === 'setSizeTo:') {
                        source += 'var f = ' + num(block[1]) + ' / 100;\n';
                        source += 'S.scale = f < 0 ? 0 : f;\n';
                    }
                    else if (block[0] === 'show') {
                        source += 'S.visible = true;\n';
                        source += 'if (S.saying) S.updateBubble();\n';
                    }
                    else if (block[0] === 'hide') {
                        source += 'S.visible = false;\n';
                        source += 'if (S.saying) S.updateBubble();\n';
                    }
                    else if (block[0] === 'comeToFront') {
                        source += 'var i = self.children.indexOf(S);\n';
                        source += 'if (i !== -1) self.children.splice(i, 1);\n';
                        source += 'self.children.push(S);\n';
                    }
                    else if (block[0] === 'goBackByLayers:') {
                        source += 'var i = self.children.indexOf(S);\n';
                        source += 'if (i !== -1) {\n';
                        source += '  self.children.splice(i, 1);\n';
                        source += '  self.children.splice(Math.max(0, i - ' + num(block[1]) + '), 0, S);\n';
                        source += '}\n';
                        // } else if (block[0] === 'setVideoState') {
                        // } else if (block[0] === 'setVideoTransparency') {
                    }
                    else if (block[0] === 'playSound:') { /* Sound */
                        if (P.audio.context) {
                            source += 'var sound = S.getSound(' + val(block[1]) + ');\n';
                            source += 'if (sound) playSound(sound);\n';
                        }
                    }
                    else if (block[0] === 'doPlaySoundAndWait') {
                        if (P.audio.context) {
                            source += 'var sound = S.getSound(' + val(block[1]) + ');\n';
                            source += 'if (sound) {\n';
                            source += '  playSound(sound);\n';
                            source += '  runtime.playingSounds++;\n';
                            source += '  save();\n';
                            source += '  R.sound = sound;\n';
                            source += '  R.start = runtime.now;\n';
                            source += '  R.duration = sound.duration;\n';
                            source += '  var first = true;\n';
                            var id = label();
                            source += '  if ((runtime.now - R.start < R.duration * 1000 || first) && runtime.stopSounds === 0) {\n';
                            source += '    var first;\n';
                            forceQueue(id);
                            source += '  }\n';
                            source += '  if (runtime.stopSounds) runtime.stopSounds--;\n';
                            source += '  runtime.playingSounds--;\n';
                            source += '  restore();\n';
                            source += '}\n';
                        }
                    }
                    else if (block[0] === 'stopAllSounds') {
                        if (P.audio.context) {
                            source += 'self.stopAllSounds();\n';
                        }
                        // } else if (block[0] === 'drum:duration:elapsed:from:') {
                    }
                    else if (block[0] === 'playDrum') {
                        beatHead(block[2]);
                        if (P.audio.context) {
                            source += 'playSpan(DRUMS[Math.round(' + num(block[1]) + ') - 1] || DRUMS[2], 60, 10);\n';
                        }
                        beatTail();
                    }
                    else if (block[0] === 'rest:elapsed:from:') {
                        beatHead(block[1]);
                        beatTail();
                    }
                    else if (block[0] === 'noteOn:duration:elapsed:from:') {
                        beatHead(block[2]);
                        if (P.audio.context) {
                            source += 'playNote(' + num(block[1]) + ', R.duration);\n';
                        }
                        beatTail();
                        // } else if (block[0] === 'midiInstrument:') {
                    }
                    else if (block[0] === 'instrument:') {
                        source += 'S.instrument = Math.max(0, Math.min(INSTRUMENTS.length - 1, ' + num(block[1]) + ' - 1)) | 0;';
                    }
                    else if (block[0] === 'changeVolumeBy:' || block[0] === 'setVolumeTo:') {
                        source += 'S.volume = Math.min(1, Math.max(0, ' + (block[0] === 'changeVolumeBy:' ? 'S.volume + ' : '') + num(block[1]) + ' / 100));\n';
                        source += 'if (S.node) S.node.gain.value = S.volume;\n';
                    }
                    else if (block[0] === 'changeTempoBy:') {
                        source += 'self.tempoBPM += ' + num(block[1]) + ';\n';
                    }
                    else if (block[0] === 'setTempoTo:') {
                        source += 'self.tempoBPM = ' + num(block[1]) + ';\n';
                    }
                    else if (block[0] === 'clearPenTrails') { /* Pen */
                        source += 'self.clearPen();\n';
                    }
                    else if (block[0] === 'putPenDown') {
                        source += 'S.isPenDown = true;\n';
                        source += 'S.dotPen();\n';
                    }
                    else if (block[0] === 'putPenUp') {
                        source += 'S.isPenDown = false;\n';
                    }
                    else if (block[0] === 'penColor:') {
                        source += 'var c = ' + num(block[1]) + ';\n';
                        source += 'S.penColor = c;\n';
                        source += 'var a = (c >> 24 & 0xff) / 0xff;\n';
                        source += 'S.penCSS = "rgba(" + (c >> 16 & 0xff) + "," + (c >> 8 & 0xff) + "," + (c & 0xff) + ", " + (a || 1) + ")";\n';
                    }
                    else if (block[0] === 'setPenHueTo:') {
                        source += noRGB;
                        source += 'S.penHue = ' + num(block[1]) + ' * 360 / 200;\n';
                        source += 'S.penSaturation = 100;\n';
                    }
                    else if (block[0] === 'changePenHueBy:') {
                        source += noRGB;
                        source += 'S.penHue += ' + num(block[1]) + ' * 360 / 200;\n';
                        source += 'S.penSaturation = 100;\n';
                    }
                    else if (block[0] === 'setPenShadeTo:') {
                        source += noRGB;
                        source += 'S.penLightness = ' + num(block[1]) + ' % 200;\n';
                        source += 'if (S.penLightness < 0) S.penLightness += 200;\n';
                        source += 'S.penSaturation = 100;\n';
                    }
                    else if (block[0] === 'changePenShadeBy:') {
                        source += noRGB;
                        source += 'S.penLightness = (S.penLightness + ' + num(block[1]) + ') % 200;\n';
                        source += 'if (S.penLightness < 0) S.penLightness += 200;\n';
                        source += 'S.penSaturation = 100;\n';
                    }
                    else if (block[0] === 'penSize:') {
                        source += 'var f = ' + num(block[1]) + ';\n';
                        source += 'S.penSize = f < 1 ? 1 : f;\n';
                    }
                    else if (block[0] === 'changePenSizeBy:') {
                        source += 'var f = S.penSize + ' + num(block[1]) + ';\n';
                        source += 'S.penSize = f < 1 ? 1 : f;\n';
                    }
                    else if (block[0] === 'stampCostume') {
                        source += 'S.stamp();\n';
                    }
                    else if (block[0] === 'setVar:to:') { /* Data */
                        source += varRef(block[1]) + ' = ' + val(block[2]) + ';\n';
                    }
                    else if (block[0] === 'changeVar:by:') {
                        var ref = varRef(block[1]);
                        source += ref + ' = (+' + ref + ' || 0) + ' + num(block[2]) + ';\n';
                    }
                    else if (block[0] === 'append:toList:') {
                        source += 'appendToList(' + listRef(block[2]) + ', ' + val(block[1]) + ');\n';
                    }
                    else if (block[0] === 'deleteLine:ofList:') {
                        source += 'deleteLineOfList(' + listRef(block[2]) + ', ' + val(block[1]) + ');\n';
                    }
                    else if (block[0] === 'insert:at:ofList:') {
                        source += 'insertInList(' + listRef(block[3]) + ', ' + val(block[2]) + ', ' + val(block[1]) + ');\n';
                    }
                    else if (block[0] === 'setLine:ofList:to:') {
                        source += 'setLineOfList(' + listRef(block[2]) + ', ' + val(block[1]) + ', ' + val(block[3]) + ');\n';
                    }
                    else if (block[0] === 'showVariable:' || block[0] === 'hideVariable:') {
                        var isShow = block[0] === 'showVariable:';
                        if (typeof block[1] !== 'string') {
                            throw new Error('Dynamic variables are not supported');
                        }
                        var o = object.vars[block[1]] !== undefined ? 'S' : 'self';
                        source += o + '.showVariable(' + val(block[1]) + ', ' + isShow + ');\n';
                        // } else if (block[0] === 'showList:') {
                        // } else if (block[0] === 'hideList:') {
                    }
                    else if (block[0] === 'broadcast:') { /* Control */
                        source += 'var threads = broadcast(' + val(block[1]) + ');\n';
                        source += 'if (threads.indexOf(BASE) !== -1) {return;}\n';
                    }
                    else if (block[0] === 'call') {
                        if (P.config.debug && block[1] === 'phosphorus: debug') {
                            source += 'debugger;\n';
                        }
                        else {
                            source += 'call(S.procedures[' + val(block[1]) + '], ' + nextLabel() + ', [';
                            for (var i = 2; i < block.length; i++) {
                                if (i > 2) {
                                    source += ', ';
                                }
                                source += val(block[i]);
                            }
                            source += ']);\n';
                            delay();
                        }
                    }
                    else if (block[0] === 'doBroadcastAndWait') {
                        source += 'save();\n';
                        source += 'R.threads = broadcast(' + val(block[1]) + ');\n';
                        source += 'if (R.threads.indexOf(BASE) !== -1) {return;}\n';
                        var id = label();
                        source += 'if (running(R.threads)) {\n';
                        forceQueue(id);
                        source += '}\n';
                        source += 'restore();\n';
                    }
                    else if (block[0] === 'doForever') {
                        var id = label();
                        seq(block[1]);
                        forceQueue(id);
                    }
                    else if (block[0] === 'doForeverIf') {
                        var id = label();
                        source += 'if (' + bool(block[1]) + ') {\n';
                        seq(block[2]);
                        source += '}\n';
                        forceQueue(id);
                        // } else if (block[0] === 'doForLoop') {
                    }
                    else if (block[0] === 'doIf') {
                        source += 'if (' + bool(block[1]) + ') {\n';
                        seq(block[2]);
                        source += '}\n';
                    }
                    else if (block[0] === 'doIfElse') {
                        source += 'if (' + bool(block[1]) + ') {\n';
                        seq(block[2]);
                        source += '} else {\n';
                        seq(block[3]);
                        source += '}\n';
                    }
                    else if (block[0] === 'doRepeat') {
                        source += 'save();\n';
                        source += 'R.count = ' + num(block[1]) + ';\n';
                        var id = label();
                        source += 'if (R.count >= 0.5) {\n';
                        source += '  R.count -= 1;\n';
                        seq(block[2]);
                        queue(id);
                        source += '} else {\n';
                        source += '  restore();\n';
                        source += '}\n';
                    }
                    else if (block[0] === 'doReturn') {
                        source += 'endCall();\n';
                        source += 'return;\n';
                    }
                    else if (block[0] === 'doUntil') {
                        var id = label();
                        source += 'if (!' + bool(block[1]) + ') {\n';
                        seq(block[2]);
                        queue(id);
                        source += '}\n';
                    }
                    else if (block[0] === 'doWhile') {
                        var id = label();
                        source += 'if (' + bool(block[1]) + ') {\n';
                        seq(block[2]);
                        queue(id);
                        source += '}\n';
                    }
                    else if (block[0] === 'doWaitUntil') {
                        var id = label();
                        source += 'if (!' + bool(block[1]) + ') {\n';
                        forceQueue(id);
                        source += '}\n';
                    }
                    else if (block[0] === 'glideSecs:toX:y:elapsed:from:') {
                        source += 'save();\n';
                        source += 'R.start = runtime.now;\n';
                        source += 'R.duration = ' + num(block[1]) + ';\n';
                        source += 'R.baseX = S.scratchX;\n';
                        source += 'R.baseY = S.scratchY;\n';
                        source += 'R.deltaX = ' + num(block[2]) + ' - S.scratchX;\n';
                        source += 'R.deltaY = ' + num(block[3]) + ' - S.scratchY;\n';
                        var id = label();
                        source += 'var f = (runtime.now - R.start) / (R.duration * 1000);\n';
                        source += 'if (f > 1 || isNaN(f)) f = 1;\n';
                        source += 'S.moveTo(R.baseX + f * R.deltaX, R.baseY + f * R.deltaY);\n';
                        source += 'if (f < 1) {\n';
                        forceQueue(id);
                        source += '}\n';
                        source += 'restore();\n';
                    }
                    else if (block[0] === 'stopAll') {
                        source += 'runtime.stopAll();\n';
                        source += 'return;\n';
                    }
                    else if (block[0] === 'stopScripts') {
                        source += 'switch (' + val(block[1]) + ') {\n';
                        source += '  case "all":\n';
                        source += '    runtime.stopAll();\n';
                        source += '    return;\n';
                        source += '  case "this script":\n';
                        source += '    endCall();\n';
                        source += '    return;\n';
                        source += '  case "other scripts in sprite":\n';
                        source += '  case "other scripts in stage":\n';
                        source += '    for (var i = 0; i < runtime.queue.length; i++) {\n';
                        source += '      if (i !== THREAD && runtime.queue[i] && runtime.queue[i].sprite === S) {\n';
                        source += '        runtime.queue[i] = undefined;\n';
                        source += '      }\n';
                        source += '    }\n';
                        source += '    break;\n';
                        source += '}\n';
                    }
                    else if (block[0] === 'wait:elapsed:from:') {
                        wait(num(block[1]));
                    }
                    else if (block[0] === 'warpSpeed') {
                        source += 'WARP++;\n';
                        seq(block[1]);
                        source += 'WARP--;\n';
                    }
                    else if (block[0] === 'createCloneOf') {
                        source += 'clone(' + val(block[1]) + ');\n';
                    }
                    else if (block[0] === 'deleteClone') {
                        source += 'if (S.isClone) {\n';
                        source += '  S.remove();\n';
                        source += '  var i = self.children.indexOf(S);\n';
                        source += '  if (i !== -1) self.children.splice(i, 1);\n';
                        source += '  for (var i = 0; i < runtime.queue.length; i++) {\n';
                        source += '    if (runtime.queue[i] && runtime.queue[i].sprite === S) {\n';
                        source += '      runtime.queue[i] = undefined;\n';
                        source += '    }\n';
                        source += '  }\n';
                        source += '  return;\n';
                        source += '}\n';
                    }
                    else if (block[0] === 'doAsk') { /* Sensing */
                        source += 'R.id = self.nextPromptId++;\n';
                        var id = label();
                        source += 'if (self.promptId < R.id) {\n';
                        forceQueue(id);
                        source += '}\n';
                        source += 'S.ask(' + val(block[1]) + ');\n';
                        var id = label();
                        source += 'if (self.promptId === R.id) {\n';
                        forceQueue(id);
                        source += '}\n';
                    }
                    else if (block[0] === 'timerReset') {
                        source += 'runtime.timerStart = runtime.now;\n';
                    }
                    else {
                        warn('Undefined command: ' + block[0]);
                    }
                };
                var source = '';
                var startfn = object.fns.length;
                var fns = [0];
                if (script[0][0] === 'procDef') {
                    var inputs = script[0][2];
                    var types = script[0][1].match(/%[snmdcb]/g) || [];
                    var used = [];
                }
                for (let i = 1; i < script.length; i++) {
                    compile(script[i]);
                }
                if (script[0][0] === 'procDef') {
                    let pre = '';
                    for (let i = types.length; i--;) {
                        // We know `used` is defined at this point, but typescript doesn't.
                        if (used[i]) {
                            const t = types[i];
                            if (t === '%d' || t === '%n' || t === '%c') {
                                pre += 'C.numargs[' + i + '] = +C.args[' + i + '] || 0;\n';
                            }
                            else if (t === '%b') {
                                pre += 'C.boolargs[' + i + '] = bool(C.args[' + i + ']);\n';
                            }
                        }
                    }
                    source = pre + source;
                    for (let i = 1, l = fns.length; i < l; ++i) {
                        fns[i] += pre.length;
                    }
                    source += 'endCall();\n';
                    source += 'return;\n';
                }
                for (let i = 0; i < fns.length; i++) {
                    object.fns.push(P.runtime.createContinuation(source.slice(fns[i])));
                }
                var f = object.fns[startfn];
                if (script[0][0] === 'whenClicked') {
                    object.listeners.whenClicked.push(f);
                }
                else if (script[0][0] === 'whenGreenFlag') {
                    object.listeners.whenGreenFlag.push(f);
                }
                else if (script[0][0] === 'whenCloned') {
                    object.listeners.whenCloned.push(f);
                }
                else if (script[0][0] === 'whenIReceive') {
                    var key = script[0][1].toLowerCase();
                    (object.listeners.whenIReceive[key] || (object.listeners.whenIReceive[key] = [])).push(f);
                }
                else if (script[0][0] === 'whenKeyPressed') {
                    if (script[0][1] === 'any') {
                        for (var i = 128; i--;) {
                            object.listeners.whenKeyPressed[i].push(f);
                        }
                    }
                    else {
                        object.listeners.whenKeyPressed[P.runtime.getKeyCode(script[0][1])].push(f);
                    }
                }
                else if (script[0][0] === 'whenSceneStarts') {
                    var key = script[0][1].toLowerCase();
                    (object.listeners.whenSceneStarts[key] || (object.listeners.whenSceneStarts[key] = [])).push(f);
                }
                else if (script[0][0] === 'procDef') {
                    const warp = script[0][4];
                    object.procedures[script[0][1]] = new Scratch2Procedure(f, warp, inputs);
                }
                else {
                    warn('Undefined event: ' + script[0][0]);
                }
                if (P.config.debug) {
                    var variant = script[0][0];
                    if (variant === 'procDef') {
                        variant += ':' + script[0][1];
                    }
                    console.log('compiled sb2 script', variant, source);
                }
            };
            function compile(stage) {
                warnings = Object.create(null);
                compileScripts(stage);
                for (var i = 0; i < stage.children.length; i++) {
                    compileScripts(stage.children[i]);
                }
                for (var key in warnings) {
                    console.warn(key + (warnings[key] > 1 ? ' (repeated ' + warnings[key] + ' times)' : ''));
                }
            }
            compiler.compile = compile;
        })(compiler = sb2.compiler || (sb2.compiler = {}));
    })(sb2 = P.sb2 || (P.sb2 = {}));
})(P || (P = {}));
/// <reference path="phosphorus.ts" />
/// <reference path="utils.ts" />
/// <reference path="core.ts" />
/// <reference path="fonts.ts" />
/// <reference path="config.ts" />
/// <reference path="runtime.ts" />
// Scratch 3 project loader and runtime objects
var P;
(function (P) {
    var sb3;
    (function (sb3) {
        // "Scratch3*" classes implement some part of the Scratch 3 runtime.
        // "SB3*" interfaces are just types for Scratch 3 projects
        /**
         * The path to fetch remote assets from.
         * Replace $md5ext with the md5sum and the format of the asset.
         */
        sb3.ASSETS_API = 'https://assets.scratch.mit.edu/internalapi/asset/$md5ext/get/';
        // Implements a Scratch 3 Stage.
        // Adds Scratch 3 specific things such as broadcastReferences
        class Scratch3Stage extends P.core.Stage {
            createVariableWatcher(target, variableName) {
                // TODO: implement
                return null;
            }
        }
        sb3.Scratch3Stage = Scratch3Stage;
        // Implements a Scratch 3 Sprite.
        class Scratch3Sprite extends P.core.Sprite {
            _clone() {
                return new Scratch3Sprite(this.stage);
            }
        }
        sb3.Scratch3Sprite = Scratch3Sprite;
        // Implements a Scratch 3 VariableWatcher.
        // Adds Scratch 3-like styling
        class Scratch3VariableWatcher extends P.core.Watcher {
            constructor(stage, data) {
                super(stage, data.spriteName || '');
                // Unique ID
                this.id = data.id;
                // Operation code, similar to other parts of Scratch 3
                this.opcode = data.opcode;
                this.mode = data.mode;
                // Watcher options, varies by opcode.
                this.params = data.params;
                // This opcode's watcherLibrary entry.
                this.libraryEntry = P.sb3.compiler.watcherLibrary[this.opcode];
                this.x = data.x;
                this.y = data.y;
                this.visible = typeof data.visible === 'boolean' ? data.visible : true;
                this.sliderMin = data.sliderMin || 0;
                this.sliderMax = data.sliderMax || 0;
                // isDiscrete doesn't always exist
                if (typeof data.isDiscrete !== 'undefined') {
                    this.sliderStep = data.isDiscrete ? 1 : 0.01;
                }
                else {
                    this.sliderStep = 1;
                }
                // Mark ourselves as invalid if the opcode is not recognized.
                if (!this.libraryEntry) {
                    console.warn('unknown watcher', this.opcode, this);
                    this.valid = false;
                }
            }
            update() {
                if (this.visible) {
                    // Value is only updated when the value has changed to reduce useless paints in some browsers.
                    const value = this.getValue();
                    if (this.valueEl.textContent !== value) {
                        this.valueEl.textContent = this.getValue();
                    }
                }
            }
            init() {
                super.init();
                // call init() if it exists
                if (this.libraryEntry.init) {
                    this.libraryEntry.init(this);
                }
                this.updateLayout();
            }
            setVisible(visible) {
                super.setVisible(visible);
                this.updateLayout();
            }
            // Gets the label of the watcher.
            // Will include the sprite's name if any.
            // Example results are 'Sprite1: my variable' and 'timer'
            getLabel() {
                const label = this.libraryEntry.getLabel(this);
                if (!this.target.isStage) {
                    return this.targetName + ': ' + label;
                }
                return label;
            }
            // Gets the value of the watcher as a string.
            getValue() {
                const value = this.libraryEntry.evaluate(this);
                // Round off numbers to the 6th decimal
                if (typeof value === 'number') {
                    return '' + (Math.round(value * 1e6) / 1e6);
                }
                return '' + value;
            }
            // Attempts to set the value of the watcher.
            // Will silently fail if this watcher cannot be set.
            setValue(value) {
                // Not all opcodes have a set()
                if (this.libraryEntry.set) {
                    this.libraryEntry.set(this, value);
                }
            }
            // Updates or creates the layout of the watcher.
            updateLayout() {
                // If the HTML element has already been created, them simply update the CSS display property.
                if (this.containerEl) {
                    this.containerEl.style.display = this.visible ? 'flex' : 'none';
                    return;
                }
                if (!this.visible) {
                    return;
                }
                const container = document.createElement('div');
                container.classList.add('s3-watcher-container');
                container.dataset.opcode = this.opcode;
                container.style.top = (this.y / 10) + 'em';
                container.style.left = (this.x / 10) + 'em';
                const value = document.createElement('div');
                value.classList.add('s3-watcher-value');
                value.textContent = this.getValue();
                this.containerEl = container;
                this.valueEl = value;
                this.stage.ui.appendChild(container);
                const mode = this.mode;
                if (mode === 'large') {
                    container.classList.add('s3-watcher-large');
                    container.appendChild(value);
                }
                else {
                    // mode is probably 'normal' or 'slider'
                    // if it's not, then 'normal' would be a good fallback anyways.
                    const row = document.createElement('div');
                    row.classList.add('s3-watcher-row');
                    row.classList.add('s3-watcher-row-normal');
                    const label = document.createElement('div');
                    label.classList.add('s3-watcher-label');
                    label.textContent = this.getLabel();
                    row.appendChild(label);
                    row.appendChild(value);
                    container.classList.add('s3-watcher-container-normal');
                    container.appendChild(row);
                    // 'slider' is a slight variation of 'normal', just with an extra slider row.
                    if (mode === 'slider') {
                        const slider = document.createElement('div');
                        slider.classList.add('s3-watcher-row-slider');
                        const input = document.createElement('input');
                        input.type = 'range';
                        input.min = '' + this.sliderMin;
                        input.max = '' + this.sliderMax;
                        input.step = '' + this.sliderStep;
                        input.value = this.getValue();
                        input.addEventListener('input', this.sliderChanged.bind(this));
                        slider.appendChild(input);
                        container.appendChild(slider);
                    }
                }
            }
            // Handles slider input events.
            sliderChanged(e) {
                const value = +e.target.value;
                this.setValue(value);
            }
        }
        sb3.Scratch3VariableWatcher = Scratch3VariableWatcher;
        class Scratch3ListWatcher extends P.core.Watcher {
            constructor(stage, data) {
                super(stage, data.spriteName || '');
                this.domRows = [];
                this.params = data.params;
                this.x = data.x;
                this.y = data.y;
                this.visible = typeof data.visible === 'boolean' ? data.visible : true;
                this.width = data.width || 100;
                this.height = data.height || 200;
            }
            update() {
                // We're not visible, so no changes would be seen. We'd only be wasting CPU cycles.
                // If the list was modified, we'll find out after we become visible.
                if (!this.visible) {
                    return;
                }
                // Silently rest if the list has not been modified to improve performance for static lists.
                if (!this.list.modified) {
                    return;
                }
                this.list.modified = false;
                this.updateContents();
            }
            updateContents() {
                const length = this.list.length;
                if (this.domRows.length < length) {
                    while (this.domRows.length < length) {
                        const row = this.createRow();
                        this.domRows.push(row);
                        this.contentEl.appendChild(row.row);
                    }
                }
                else if (this.domRows.length > length) {
                    while (this.domRows.length > length) {
                        this.domRows.pop();
                        this.contentEl.removeChild(this.contentEl.lastChild);
                    }
                }
                for (var i = 0; i < length; i++) {
                    const { value } = this.domRows[i];
                    const rowText = '' + this.list[i];
                    if (rowText !== value.textContent) {
                        value.textContent = rowText;
                    }
                }
                const bottomLabelText = this.getBottomLabel();
                if (this.bottomLabelEl.textContent !== bottomLabelText) {
                    this.bottomLabelEl.textContent = this.getBottomLabel();
                }
            }
            init() {
                super.init();
                const listName = this.params.LIST;
                if (!(listName in this.target.lists)) {
                    // Create the list if it doesn't exist.
                    // It might be better to mark ourselves as invalid instead, but this works just fine.
                    this.target.lists[listName] = new Scratch3List();
                }
                this.list = this.target.lists[listName];
                this.target.watchers[listName] = this;
                this.updateLayout();
                if (this.visible) {
                    this.updateContents();
                }
            }
            getTopLabel() {
                return this.params.LIST;
            }
            getBottomLabel() {
                return 'length ' + this.list.length;
            }
            updateLayout() {
                if (!this.containerEl) {
                    this.createLayout();
                }
                this.containerEl.style.display = this.visible ? '' : 'none';
            }
            setVisible(visible) {
                super.setVisible(visible);
                this.updateLayout();
            }
            createRow() {
                const row = document.createElement('div');
                const index = document.createElement('div');
                const value = document.createElement('div');
                row.classList.add('s3-list-row');
                index.classList.add('s3-list-index');
                value.classList.add('s3-list-value');
                index.textContent = (this.domRows.length + 1).toString();
                row.appendChild(index);
                row.appendChild(value);
                return { row, index, value };
            }
            createLayout() {
                this.containerEl = document.createElement('div');
                this.topLabelEl = document.createElement('div');
                this.bottomLabelEl = document.createElement('div');
                this.contentEl = document.createElement('div');
                this.containerEl.style.top = (this.y / 10) + 'em';
                this.containerEl.style.left = (this.x / 10) + 'em';
                this.containerEl.style.height = (this.height / 10) + 'em';
                this.containerEl.style.width = (this.width / 10) + 'em';
                this.containerEl.classList.add('s3-list-container');
                this.topLabelEl.textContent = this.getTopLabel();
                this.topLabelEl.classList.add('s3-list-top-label');
                this.bottomLabelEl.textContent = this.getBottomLabel();
                this.bottomLabelEl.classList.add('s3-list-bottom-label');
                this.contentEl.classList.add('s3-list-content');
                this.containerEl.appendChild(this.topLabelEl);
                this.containerEl.appendChild(this.contentEl);
                this.containerEl.appendChild(this.bottomLabelEl);
                this.stage.ui.appendChild(this.containerEl);
            }
        }
        sb3.Scratch3ListWatcher = Scratch3ListWatcher;
        // Implements a Scratch 3 procedure.
        // Scratch 3 uses names as references for arguments (Scratch 2 uses indexes I believe)
        class Scratch3Procedure extends P.core.Procedure {
            call(inputs) {
                const args = {};
                for (var i = 0; i < this.inputs.length; i++) {
                    args[this.inputs[i]] = inputs[i];
                }
                return args;
            }
        }
        sb3.Scratch3Procedure = Scratch3Procedure;
        // An Array usable by the Scratch 3 compiler.
        // Implements Scratch list blocks and their behavior.
        class Scratch3List extends Array {
            constructor() {
                super(...arguments);
                this.modified = false;
            }
            // Modified toString() that functions like Scratch.
            toString() {
                var i = this.length;
                while (i--) {
                    if (('' + this[i]).length !== 1) {
                        return this.join(' ');
                    }
                }
                return this.join('');
            }
            /**
             * Determines the "real" 0-indexed index of a 1-indexed Scratch index.
             * @param index A scratch 1-indexed index, or 'random', 'any', 'last'
             * @returns The 0-indexed index, or -1
             */
            scratchIndex(index) {
                if (index === 'random' || index === 'any') {
                    return Math.floor(Math.random() * this.length);
                }
                if (index === 'last') {
                    return this.length - 1;
                }
                index = Math.floor(+index);
                if (index < 1 || index > this.length) {
                    return -1;
                }
                return index - 1;
            }
            // Deletes a line from the list.
            // index is a scratch index.
            deleteLine(index) {
                if (index === 'all') {
                    this.modified = true;
                    this.length = 0;
                    return;
                }
                index = this.scratchIndex(index);
                if (index === this.length - 1) {
                    this.modified = true;
                    this.pop();
                }
                else if (index !== -1) {
                    this.modified = true;
                    this.splice(index, 1);
                }
            }
            // Adds an item to the list.
            push(...items) {
                this.modified = true;
                return super.push(...items);
            }
            // Inserts an item at a spot in the list.
            // Index is a Scratch index.
            insert(index, value) {
                // TODO: simplify/refactor
                if (+index === 1) {
                    this.modified = true;
                    this.unshift(value);
                    return;
                }
                index = this.scratchIndex(index);
                if (index === this.length) {
                    this.modified = true;
                    this.push(value);
                }
                else if (index !== -1) {
                    this.modified = true;
                    this.splice(index, 0, value);
                }
            }
            // Sets the index of something in the list.
            set(index, value) {
                index = this.scratchIndex(index);
                if (index !== -1) {
                    this.modified = true;
                    this[index] = value;
                }
            }
        }
        sb3.Scratch3List = Scratch3List;
        /**
         * Patches and modifies an SVG element in-place to make it function properly in the forkphorus environment.
         * Fixes fonts and viewBox.
         */
        function patchSVG(svg) {
            // Special treatment for the viewBox attribute
            if (svg.hasAttribute('viewBox')) {
                const viewBox = svg.getAttribute('viewBox').split(/ |,/).map((i) => +i);
                if (viewBox.every((i) => !isNaN(i)) && viewBox.length === 4) {
                    const [x, y, w, h] = viewBox;
                    // Fix width/height to include the viewBox min x/y
                    svg.setAttribute('width', (w + x).toString());
                    svg.setAttribute('height', (h + y).toString());
                }
                else {
                    console.warn('weird viewBox', svg.getAttribute('viewBox'));
                }
                svg.removeAttribute('viewBox');
            }
            const textElements = svg.querySelectorAll('text');
            const usedFonts = [];
            for (var i = 0; i < textElements.length; i++) {
                const el = textElements[i];
                let font = el.getAttribute('font-family') || '';
                if (!P.fonts.scratch3[font]) {
                    console.warn('unknown font', font);
                    el.setAttribute('font-family', font);
                    font = 'Sans Serif';
                }
                if (usedFonts.indexOf(font) === -1) {
                    usedFonts.push(font);
                }
            }
            P.fonts.addFontRules(svg, usedFonts);
        }
        // Implements base SB3 loading logic.
        // Needs to be extended to add file loading methods.
        // Implementations are expected to set `this.projectData` to something before calling super.load()
        class BaseSB3Loader {
            getSVG(path) {
                return this.getAsText(path)
                    .then((source) => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(source, 'image/svg+xml');
                    const svg = doc.documentElement;
                    patchSVG(svg);
                    return new Promise((resolve, reject) => {
                        const image = new Image();
                        image.onload = (e) => {
                            resolve(image);
                        };
                        image.onerror = (e) => {
                            reject(e);
                        };
                        image.src = 'data:image/svg+xml,' + encodeURIComponent(svg.outerHTML);
                    });
                });
            }
            getBitmapImage(path, format) {
                return this.getAsImage(path, format);
            }
            loadCostume(data, index) {
                const path = data.assetId + '.' + data.dataFormat;
                const costumeOptions = {
                    name: data.name,
                    bitmapResolution: data.bitmapResolution || 1,
                    rotationCenterX: data.rotationCenterX,
                    rotationCenterY: data.rotationCenterY,
                };
                if (data.dataFormat === 'svg') {
                    return this.getSVG(path)
                        .then((svg) => new P.core.VectorCostume(svg, costumeOptions));
                }
                else {
                    return this.getBitmapImage(path, data.dataFormat)
                        .then((image) => new P.core.BitmapCostume(image, costumeOptions));
                }
            }
            getAudioBuffer(path) {
                return this.getAsArrayBuffer(path)
                    .then((buffer) => P.audio.decodeAudio(buffer))
                    .catch((err) => {
                    throw new Error(`Could not load audio: ${path} (${err})`);
                });
            }
            loadSound(data) {
                return new Promise((resolve, reject) => {
                    this.getAudioBuffer(data.md5ext)
                        .then((buffer) => {
                        resolve(new P.core.Sound({
                            name: data.name,
                            buffer,
                        }));
                    })
                        .catch((err) => {
                        console.warn('Could not load sound: ' + err);
                        resolve(null);
                    });
                });
            }
            loadWatcher(data, stage) {
                if (data.mode === 'list') {
                    return new Scratch3ListWatcher(stage, data);
                }
                return new Scratch3VariableWatcher(stage, data);
            }
            loadTarget(data) {
                // dirty hack for null stage
                const target = new (data.isStage ? Scratch3Stage : Scratch3Sprite)(null);
                for (const id of Object.keys(data.variables)) {
                    const variable = data.variables[id];
                    const name = variable[0];
                    const value = variable[1];
                    target.vars[name] = value;
                }
                for (const id of Object.keys(data.lists)) {
                    const list = data.lists[id];
                    const name = list[0];
                    const content = list[1];
                    target.lists[name] = new Scratch3List().concat(content);
                }
                target.name = data.name;
                target.currentCostumeIndex = data.currentCostume;
                target.sb3data = data;
                if (target.isStage) {
                }
                else {
                    const sprite = target;
                    sprite.scratchX = data.x;
                    sprite.scratchY = data.y;
                    sprite.visible = data.visible;
                    sprite.direction = data.direction;
                    sprite.scale = data.size / 100;
                    sprite.isDraggable = data.draggable;
                    sprite.rotationStyle = P.utils.parseRotationStyle(data.rotationStyle);
                }
                const costumesPromise = Promise.all(data.costumes.map((c, i) => this.loadCostume(c, i)));
                const soundsPromise = Promise.all(data.sounds.map((c) => this.loadSound(c)));
                return Promise.all([costumesPromise, soundsPromise])
                    .then((result) => {
                    const costumes = result[0];
                    const sounds = result[1];
                    target.costumes = costumes;
                    sounds.forEach((sound) => sound && target.addSound(sound));
                    return target;
                });
            }
            loadFonts() {
                return P.fonts.loadFontSet(P.fonts.scratch3);
            }
            load() {
                if (!this.projectData) {
                    throw new Error('invalid project data');
                }
                if (!Array.isArray(this.projectData.targets)) {
                    throw new Error('no targets');
                }
                const targets = this.projectData.targets;
                // sort targets by their layerOrder to match how they will display
                targets.sort((a, b) => a.layerOrder - b.layerOrder);
                return this.loadFonts()
                    .then(() => Promise.all(targets.map((data) => this.loadTarget(data))))
                    .then((targets) => {
                    const stage = targets.filter((i) => i.isStage)[0];
                    if (!stage) {
                        throw new Error('no stage object');
                    }
                    const sprites = targets.filter((i) => i.isSprite);
                    const watchers = this.projectData.monitors
                        .map((data) => this.loadWatcher(data, stage))
                        .filter((i) => i && i.valid);
                    sprites.forEach((sprite) => sprite.stage = stage);
                    targets.forEach((base) => new P.sb3.compiler.Compiler(base).compile());
                    stage.children = sprites;
                    stage.allWatchers = watchers;
                    watchers.forEach((watcher) => watcher.init());
                    stage.updateBackdrop();
                    return stage;
                });
            }
        }
        sb3.BaseSB3Loader = BaseSB3Loader;
        // Loads a .sb3 file
        class SB3FileLoader extends BaseSB3Loader {
            constructor(buffer) {
                super();
                this.buffer = buffer;
            }
            getAsText(path) {
                P.IO.progressHooks.new();
                return this.zip.file(path).async('text')
                    .then((response) => {
                    P.IO.progressHooks.end();
                    return response;
                });
            }
            getAsArrayBuffer(path) {
                P.IO.progressHooks.new();
                return this.zip.file(path).async('arrayBuffer')
                    .then((response) => {
                    P.IO.progressHooks.end();
                    return response;
                });
            }
            getAsBase64(path) {
                P.IO.progressHooks.new();
                return this.zip.file(path).async('base64')
                    .then((response) => {
                    P.IO.progressHooks.end();
                    return response;
                });
            }
            getAsImage(path, format) {
                P.IO.progressHooks.new();
                return this.getAsBase64(path)
                    .then((imageData) => {
                    return new Promise((resolve, reject) => {
                        const image = new Image();
                        image.onload = function () {
                            P.IO.progressHooks.end();
                            resolve(image);
                        };
                        image.onerror = function (error) {
                            P.IO.progressHooks.error(error);
                            reject('Failed to load image: ' + path + '.' + format);
                        };
                        image.src = 'data:image/' + format + ';base64,' + imageData;
                    });
                });
            }
            load() {
                return JSZip.loadAsync(this.buffer)
                    .then((data) => {
                    this.zip = data;
                    return this.getAsText('project.json');
                })
                    .then((project) => {
                    this.projectData = JSON.parse(project);
                })
                    .then(() => super.load());
            }
        }
        sb3.SB3FileLoader = SB3FileLoader;
        // Loads a Scratch 3 project from the scratch.mit.edu website
        // Uses either a loaded project.json or its ID
        class Scratch3Loader extends BaseSB3Loader {
            constructor(idOrData) {
                super();
                if (typeof idOrData === 'object') {
                    this.projectData = idOrData;
                    this.projectId = null;
                }
                else {
                    this.projectId = idOrData;
                }
            }
            getAsText(path) {
                return new P.IO.TextRequest(sb3.ASSETS_API.replace('$md5ext', path)).load();
            }
            getAsArrayBuffer(path) {
                return new P.IO.ArrayBufferRequest(sb3.ASSETS_API.replace('$md5ext', path)).load();
            }
            getAsImage(path) {
                P.IO.progressHooks.new();
                return new Promise((resolve, reject) => {
                    const image = new Image();
                    image.onload = function () {
                        P.IO.progressHooks.end();
                        resolve(image);
                    };
                    image.onerror = function (err) {
                        P.IO.progressHooks.error(err);
                        reject('Failed to load image: ' + image.src);
                    };
                    image.crossOrigin = 'anonymous';
                    image.src = sb3.ASSETS_API.replace('$md5ext', path);
                });
            }
            load() {
                if (this.projectId) {
                    return new P.IO.JSONRequest(P.config.PROJECT_API.replace('$id', '' + this.projectId)).load()
                        .then((data) => {
                        this.projectData = data;
                        return super.load();
                    });
                }
                else {
                    return super.load();
                }
            }
        }
        sb3.Scratch3Loader = Scratch3Loader;
    })(sb3 = P.sb3 || (P.sb3 = {}));
})(P || (P = {}));
/**
 * The Scratch 3 compiler.
 */
(function (P) {
    var sb3;
    (function (sb3) {
        var compiler;
        (function (compiler_1) {
            /**
             * Asserts at compile-time that a value is of the type `never`
             */
            function assertNever(i) {
                throw new Error('assertion failed');
            }
            class CompiledInput {
                constructor(source, type) {
                    this.source = source;
                    this.type = type;
                }
            }
            compiler_1.CompiledInput = CompiledInput;
            // Shorter CompiledInput aliases
            const stringInput = (v) => new CompiledInput(v, 'string');
            const numberInput = (v) => new CompiledInput(v, 'number');
            const booleanInput = (v) => new CompiledInput(v, 'boolean');
            const anyInput = (v) => new CompiledInput(v, 'any');
            ;
            /**
             * General block generation utilities.
             */
            class BlockUtil {
                constructor(compiler, block) {
                    this.compiler = compiler;
                    this.block = block;
                }
                /**
                 * Compile an input, and give it a type.
                 */
                getInput(name, type) {
                    return this.compiler.compileInput(this.block, name, type);
                }
                /**
                 * Compile a field. Results are unescaped strings and unsafe to include in a script.
                 */
                getField(name) {
                    return this.compiler.getField(this.block, name);
                }
                /**
                 * Get and sanitize a field.
                 */
                fieldInput(name) {
                    return this.sanitizedInput(this.getField(name));
                }
                /**
                 * Sanitize an unescaped string into an input.
                 */
                sanitizedInput(string) {
                    return this.compiler.sanitizedInput(string);
                }
                /**
                 * Sanitize an unescaped string for inclusion in a script.
                 */
                sanitizedString(string) {
                    return this.compiler.sanitizedString(string);
                }
                /**
                 * Gets a field's reference to a variable.
                 */
                getVariableReference(field) {
                    return this.compiler.getVariableReference(this.getField(field));
                }
                /**
                 * Gets a field's reference to a list.
                 */
                getListReference(field) {
                    return this.compiler.getListReference(this.getField(field));
                }
                /**
                 * Gets the scope of a field's reference to a variable.
                 */
                getVariableScope(field) {
                    return this.compiler.getVariableScope(this.getField(field));
                }
                /**
                 * Gets the scope of a field's reference to a list.
                 */
                getListScope(field) {
                    return this.compiler.getListScope(this.getField(field));
                }
                /**
                 * Forcibly converts JS to another type.
                 */
                asType(input, type) {
                    return this.compiler.asType(input, type);
                }
            }
            compiler_1.BlockUtil = BlockUtil;
            /**
             * General statement generation utilities.
             */
            class StatementUtil extends BlockUtil {
                constructor() {
                    super(...arguments);
                    this.content = '';
                    this.substacksQueue = false;
                }
                /**
                 * Compile a substack.
                 */
                getSubstack(name) {
                    const labelsBefore = this.compiler.labelCount;
                    const substack = this.compiler.compileSubstackInput(this.block, name);
                    if (this.compiler.labelCount !== labelsBefore) {
                        this.substacksQueue = true;
                    }
                    return substack;
                }
                /**
                 * Gets the next label ID ready for use. The ID is unique and will cannot be reused.
                 */
                claimNextLabel() {
                    return this.compiler.labelCount++;
                }
                /**
                 * Create a new label at this location. A label ID will be created if none is supplied.
                 */
                addLabel(label) {
                    if (!label) {
                        label = this.claimNextLabel();
                    }
                    // We'll use special syntax to denote this spot as a label.
                    // It'll be cleaned up later in compilation.
                    // Interestingly, this is actually valid JavaScript, so cleanup isn't strictly necessary.
                    this.write(`{{${label}}}`);
                    return label;
                }
                /**
                 * Writes the queue() method to call a label.
                 */
                queue(label) {
                    this.writeLn(`queue(${label}); return;`);
                }
                /**
                 * Writes the forceQueue() method to call a label.
                 */
                forceQueue(label) {
                    this.writeLn(`forceQueue(${label}); return;`);
                }
                /**
                 * Writes an appropriate VISUAL check
                 */
                visual(variant) {
                    switch (variant) {
                        case 'drawing':
                            this.writeLn('if (S.visible || S.isPenDown) VISUAL = true;');
                            break;
                        case 'visible':
                            this.writeLn('if (S.visible) VISUAL = true;');
                            break;
                        case 'always':
                            this.writeLn('VISUAL = true;');
                            break;
                        default: assertNever(variant);
                    }
                }
                /**
                 * Update the speech bubble, if any.
                 */
                updateBubble() {
                    this.writeLn('if (S.saying) S.updateBubble()');
                }
                /**
                 * Writes JS to pause the script for a known duration of time.
                 */
                wait(seconds) {
                    this.writeLn('save();');
                    this.writeLn('R.start = runtime.now;');
                    this.writeLn(`R.duration = ${seconds}`);
                    this.writeLn('var first = true;');
                    const label = this.addLabel();
                    this.writeLn('if (runtime.now - R.start < R.duration * 1000 || first) {');
                    this.writeLn('  var first;');
                    this.forceQueue(label);
                    this.writeLn('}');
                    this.writeLn('restore();');
                }
                /**
                 * Append to the content
                 */
                write(content) {
                    this.content += content;
                }
                /**
                 * Append to the content, followed by a newline.
                 */
                writeLn(content) {
                    this.content += content + '\n';
                }
            }
            compiler_1.StatementUtil = StatementUtil;
            /**
             * General input generation utilities.
             */
            class InputUtil extends BlockUtil {
                numberInput(v) { return numberInput(v); }
                stringInput(v) { return stringInput(v); }
                booleanInput(v) { return booleanInput(v); }
                anyInput(v) { return anyInput(v); }
            }
            compiler_1.InputUtil = InputUtil;
            /**
             * General hat handling utilities.
             */
            class HatUtil extends BlockUtil {
                constructor(compiler, block, startingFunction) {
                    super(compiler, block);
                    this.startingFunction = startingFunction;
                    this.target = compiler.target;
                }
            }
            compiler_1.HatUtil = HatUtil;
            // Block definitions
            compiler_1.statementLibrary = Object.create(null);
            compiler_1.inputLibrary = Object.create(null);
            compiler_1.hatLibrary = Object.create(null);
            compiler_1.watcherLibrary = Object.create(null);
            /**
             * The new compiler for Scratch 3 projects.
             */
            class Compiler {
                constructor(target) {
                    /**
                     * Total number of labels created by this compiler.
                     */
                    this.labelCount = 0;
                    this.target = target;
                    this.data = target.sb3data;
                    this.blocks = this.data.blocks;
                }
                /**
                 * Gets the IDs of all hat blocks.
                 */
                getHatBlocks() {
                    return Object.keys(this.blocks)
                        .filter((i) => this.blocks[i].topLevel);
                }
                /**
                 * Get the compiler for a statement
                 */
                getStatementCompiler(opcode) {
                    if (compiler_1.statementLibrary[opcode]) {
                        return compiler_1.statementLibrary[opcode];
                    }
                    return null;
                }
                /**
                 * Get the compiler for an input
                 */
                getInputCompiler(opcode) {
                    if (compiler_1.inputLibrary[opcode]) {
                        return compiler_1.inputLibrary[opcode];
                    }
                    return null;
                }
                /**
                 * Get the compiler for a hat
                 */
                getHatCompiler(opcode) {
                    if (compiler_1.hatLibrary[opcode]) {
                        return compiler_1.hatLibrary[opcode];
                    }
                    return null;
                }
                /**
                 * Gets the default value to use for a missing input.
                 */
                getInputFallback(type) {
                    switch (type) {
                        case 'number': return '0';
                        case 'boolean': return 'false';
                        case 'string': return '""';
                        case 'any': return '""';
                    }
                    assertNever(type);
                }
                /**
                 * Applies type coercions to JS to forcibly change it's type.
                 */
                asType(input, type) {
                    switch (type) {
                        case 'string': return '("" + ' + input + ')';
                        case 'number': return '+' + input;
                        case 'boolean': return 'bool(' + input + ')';
                        case 'any': return input;
                    }
                    assertNever(type);
                }
                /**
                 * Converts a compiled input to another type, if necessary
                 */
                convertInputType(input, type) {
                    // If the types are already identical, no changes are necessary
                    if (input.type === type) {
                        return input.source;
                    }
                    return this.asType(input.source, type);
                }
                /**
                 * Sanitize a string into a CompiledInput
                 */
                sanitizedInput(string) {
                    return stringInput(this.sanitizedString(string));
                }
                /**
                 * Sanitize a string for use in the runtime.
                 */
                sanitizedString(string) {
                    // Sometimes weird things happen and non-strings get passed around to here.
                    if (typeof string !== 'string') {
                        console.warn('sanitizedString got a non-string object', string);
                        string = string + '';
                    }
                    string = string
                        .replace(/\\/g, '\\\\')
                        .replace(/'/g, '\\\'')
                        .replace(/"/g, '\\"')
                        .replace(/\n/g, '\\n')
                        .replace(/\r/g, '\\r')
                        .replace(/\{/g, '\\x7b')
                        .replace(/\}/g, '\\x7d');
                    return `"${string}"`;
                }
                /**
                 * Creates a sanitized block comment with the given contents.
                 */
                sanitizedComment(content) {
                    // just disallow the content from ending the comment, and everything should be fine.
                    content = content
                        .replace(/\*\//g, '');
                    return `/* ${content} */`;
                }
                /**
                 * Determines the runtime object that owns a variable in the runtime.
                 * The variable may be created if it cannot be found.
                 */
                getVariableScope(name) {
                    if (name in this.target.stage.vars) {
                        return 'self';
                    }
                    else if (name in this.target.vars) {
                        return 'S';
                    }
                    else {
                        // Create missing variables in the sprite scope.
                        this.target.vars[name] = 0;
                        return 'S';
                    }
                }
                /**
                 * Determines the runtime object that owns a list in the runtime.
                 * The list may be created if it cannot be found.
                 */
                getListScope(name) {
                    if (name in this.target.stage.lists) {
                        return 'self';
                    }
                    else if (name in this.target.lists) {
                        return 'S';
                    }
                    else {
                        // Create missing lists in the sprite scope.
                        this.target.lists[name] = new sb3.Scratch3List();
                        return 'S';
                    }
                }
                /**
                 * Gets the runtime reference to a variable.
                 */
                getVariableReference(name) {
                    return `${this.getVariableScope(name)}.vars[${this.sanitizedString(name)}]`;
                }
                /**
                 * Gets the runtime reference to a list.
                 */
                getListReference(name) {
                    return `${this.getListScope(name)}.lists[${this.sanitizedString(name)}]`;
                }
                /**
                 * Compile a native or primitive value.
                 */
                compileNativeInput(native) {
                    const type = native[0];
                    switch (type) {
                        // These all function as numbers. I believe they are only differentiated so the editor can be more helpful.
                        case 4 /* MATH_NUM */:
                        case 5 /* POSITIVE_NUM */:
                        case 6 /* WHOLE_NUM */:
                        case 7 /* INTEGER_NUM */:
                        case 8 /* ANGLE_NUM */: {
                            // [type, value]
                            const number = parseFloat(native[1]);
                            if (!isNaN(number)) {
                                return numberInput(number.toString());
                            }
                            else {
                                return this.sanitizedInput(native[1]);
                            }
                        }
                        case 10 /* TEXT */:
                            // [type, text]
                            return this.sanitizedInput(native[1] + '');
                        case 12 /* VAR */:
                            // [type, name, id]
                            return anyInput(this.getVariableReference(native[1]));
                        case 13 /* LIST */:
                            // [type, name, id]
                            return anyInput(this.getListReference(native[1]));
                        case 11 /* BROADCAST */:
                            // [type, name, id]
                            return this.sanitizedInput(native[1]);
                        case 9 /* COLOR_PICKER */: {
                            // [type, color]
                            // Color is a value like "#abcdef"
                            const color = native[1];
                            const hex = color.substr(1);
                            // Ensure that it is actually a hex number.
                            if (/^[0-9a-f]{6,8}$/.test(hex)) {
                                return numberInput('0x' + hex);
                            }
                            else {
                                this.warn('expected hex color code but got', hex);
                                return numberInput('0x0');
                            }
                        }
                        default:
                            this.warn('unknown native', type, native);
                            return stringInput('""');
                    }
                }
                /**
                 * Compile an input of a block, and do any necessary type coercions.
                 */
                compileInput(parentBlock, inputName, type) {
                    // Handling when the block does not contain an input entry.
                    if (!parentBlock.inputs[inputName]) {
                        // This could be a sign of another issue, so log a warning.
                        this.warn('missing input', inputName);
                        return this.getInputFallback(type);
                    }
                    const input = parentBlock.inputs[inputName];
                    if (Array.isArray(input[1])) {
                        const native = input[1];
                        return this.convertInputType(this.compileNativeInput(native), type);
                    }
                    const inputBlockId = input[1];
                    // Handling null inputs where the input exists but is just empty.
                    // This is normal and happens very often.
                    if (!inputBlockId) {
                        return this.getInputFallback(type);
                    }
                    const inputBlock = this.blocks[inputBlockId];
                    const opcode = inputBlock.opcode;
                    const compiler = this.getInputCompiler(opcode);
                    // If we don't recognize this block, that's a problem.
                    if (!compiler) {
                        this.warn('unknown input', opcode, inputBlock);
                        return this.getInputFallback(type);
                    }
                    const util = new InputUtil(this, inputBlock);
                    let result = compiler(util);
                    if (P.config.debug) {
                        result.source = this.sanitizedComment(inputBlock.opcode) + result.source;
                    }
                    return this.convertInputType(result, type);
                }
                /**
                 * Get a field of a block.
                 */
                getField(block, fieldName) {
                    const value = block.fields[fieldName];
                    if (!value) {
                        // This could be a sign of another issue, so log a warning.
                        this.warn('missing field', fieldName);
                        return '';
                    }
                    return value[0];
                }
                /**
                 * Compile a script within a script.
                 */
                compileSubstackInput(block, substackName) {
                    // empty substacks are normal
                    if (!block.inputs[substackName]) {
                        return '';
                    }
                    const substack = block.inputs[substackName];
                    const type = substack[0];
                    const id = substack[1];
                    if (id === null) {
                        return '';
                    }
                    return this.compileStack(id);
                }
                /**
                 * Creates a fresh CompilerState
                 */
                getNewState() {
                    return {
                        isWarp: false,
                    };
                }
                /**
                 * Compile an entire script from a starting block.
                 */
                compileStack(startingBlock) {
                    let script = '';
                    let block = this.blocks[startingBlock];
                    while (true) {
                        var opcode = block.opcode;
                        const compiler = this.getStatementCompiler(opcode);
                        if (P.config.debug) {
                            script += this.sanitizedComment(block.opcode);
                        }
                        if (compiler) {
                            const util = new StatementUtil(this, block);
                            compiler(util);
                            script += util.content;
                        }
                        else {
                            script += '/* unknown statement */';
                            this.warn('unknown statement', opcode, block);
                        }
                        if (!block.next) {
                            break;
                        }
                        block = this.blocks[block.next];
                    }
                    return script;
                }
                /**
                 * Compile a hat block and its children.
                 * The hat handler will be used, and the scripts will be installed.
                 */
                compileHat(hat) {
                    const hatCompiler = this.getHatCompiler(hat.opcode);
                    if (!hatCompiler) {
                        // If a hat block is otherwise recognized as an input or statement, don't warn.
                        // Most projects have at least one of these "dangling" blocks.
                        if (!this.getInputCompiler(hat.opcode) && !this.getStatementCompiler(hat.opcode)) {
                            this.warn('unknown hat block', hat.opcode, hat);
                        }
                        return;
                    }
                    this.labelCount = this.target.fns.length;
                    const startingBlock = hat.next;
                    // Empty hats will be ignored
                    if (!startingBlock) {
                        return;
                    }
                    this.state = this.getNewState();
                    if (hatCompiler.precompile) {
                        hatCompiler.precompile(this, hat);
                    }
                    // There is always a label placed at the beginning of the script.
                    // If you're clever, you may be able to remove this at some point.
                    let script = `{{${this.labelCount++}}}`;
                    script += this.compileStack(startingBlock);
                    // If a block wants to do some changes to the script after script generation but before compilation, let it.
                    // TODO: should this happen after parseResult?
                    if (hatCompiler.postcompile) {
                        script = hatCompiler.postcompile(this, script, hat);
                    }
                    // Parse the script to search for labels, and remove the label metadata.
                    const parseResult = this.parseScript(script);
                    const parsedScript = parseResult.script;
                    const startFn = this.target.fns.length;
                    for (let label of Object.keys(parseResult.labels)) {
                        this.target.fns[label] = P.runtime.createContinuation(parsedScript.slice(parseResult.labels[label]));
                    }
                    const startingFn = this.target.fns[startFn];
                    const util = new HatUtil(this, hat, startingFn);
                    hatCompiler.handle(util);
                    if (P.config.debug) {
                        this.log('compiled sb3 script', hat.opcode, script, this.target);
                    }
                }
                /**
                 * Parse a generated script for label locations, and remove redundant data.
                 */
                parseScript(script) {
                    const labels = {};
                    let index = 0;
                    let accumulator = 0;
                    while (true) {
                        const labelStart = script.indexOf('{{', index);
                        if (labelStart === -1) {
                            break;
                        }
                        const labelEnd = script.indexOf('}}', index);
                        const id = script.substring(labelStart + 2, labelEnd);
                        const length = labelEnd + 2 - labelStart;
                        accumulator += length;
                        labels[id] = labelEnd + 2 - accumulator;
                        index = labelEnd + 2;
                    }
                    // We don't **actually* have to remove the {{0}} labels (its technically valid JS),
                    // but it's probably a good idea.
                    const fixedScript = script.replace(/{{\d+}}/g, '');
                    return {
                        labels,
                        script: fixedScript,
                    };
                }
                /**
                 * Log a warning
                 */
                warn(...args) {
                    console.warn.apply(console, args);
                }
                /**
                 * Log info
                 */
                log(...args) {
                    console.log.apply(console, args);
                }
                /**
                 * Compiles the scripts of the target with the current data.
                 */
                compile() {
                    const hats = this.getHatBlocks();
                    for (const hatId of hats) {
                        const hat = this.blocks[hatId];
                        this.compileHat(hat);
                    }
                }
            }
            compiler_1.Compiler = Compiler;
        })(compiler = sb3.compiler || (sb3.compiler = {}));
    })(sb3 = P.sb3 || (P.sb3 = {}));
})(P || (P = {}));
/**
 * Scratch 3 blocks.
 */
(function () {
    const statementLibrary = P.sb3.compiler.statementLibrary;
    const inputLibrary = P.sb3.compiler.inputLibrary;
    const hatLibrary = P.sb3.compiler.hatLibrary;
    const watcherLibrary = P.sb3.compiler.watcherLibrary;
    /* Statements */
    statementLibrary['control_all_at_once'] = function (util) {
        // https://github.com/LLK/scratch-vm/blob/bb42c0019c60f5d1947f3432038aa036a0fddca6/src/blocks/scratch3_control.js#L194-L199
        const SUBSTACK = util.getSubstack('SUBSTACK');
        util.write(SUBSTACK);
    };
    statementLibrary['control_clear_counter'] = function (util) {
        util.writeLn('self.counter = 0;');
    };
    statementLibrary['control_create_clone_of'] = function (util) {
        const CLONE_OPTION = util.getInput('CLONE_OPTION', 'any');
        util.writeLn(`clone(${CLONE_OPTION});`);
    };
    statementLibrary['control_delete_this_clone'] = function (util) {
        util.writeLn('if (S.isClone) {\n');
        util.writeLn('  S.remove();\n');
        util.writeLn('  var i = self.children.indexOf(S);\n');
        util.writeLn('  if (i !== -1) self.children.splice(i, 1);\n');
        util.writeLn('  for (var i = 0; i < runtime.queue.length; i++) {\n');
        util.writeLn('    if (runtime.queue[i] && runtime.queue[i].sprite === S) {\n');
        util.writeLn('      runtime.queue[i] = undefined;\n');
        util.writeLn('    }\n');
        util.writeLn('  }\n');
        util.writeLn('  return;\n');
        util.writeLn('}\n');
    };
    statementLibrary['control_forever'] = function (util) {
        const SUBSTACK = util.getSubstack('SUBSTACK');
        if (util.compiler.state.isWarp && !util.substacksQueue) {
            util.writeLn('while (true) {');
            util.write(SUBSTACK);
            util.writeLn('}');
        }
        else {
            const label = util.addLabel();
            util.write(SUBSTACK);
            util.queue(label);
        }
    };
    statementLibrary['control_if'] = function (util) {
        const CONDITION = util.getInput('CONDITION', 'any');
        const SUBSTACK = util.getSubstack('SUBSTACK');
        util.writeLn(`if (${CONDITION}) {`);
        util.write(SUBSTACK);
        util.writeLn('}');
    };
    statementLibrary['control_if_else'] = function (util) {
        const CONDITION = util.getInput('CONDITION', 'any');
        const SUBSTACK = util.getSubstack('SUBSTACK');
        const SUBSTACK2 = util.getSubstack('SUBSTACK2');
        util.writeLn(`if (${CONDITION}) {`);
        util.write(SUBSTACK);
        util.writeLn('} else {');
        util.write(SUBSTACK2);
        util.writeLn('}');
    };
    statementLibrary['control_incr_counter'] = function (util) {
        util.writeLn('self.counter++;');
    };
    statementLibrary['control_repeat'] = function (util) {
        const TIMES = util.getInput('TIMES', 'any');
        const SUBSTACK = util.getSubstack('SUBSTACK');
        if (util.compiler.state.isWarp && !util.substacksQueue) {
            util.writeLn('save();');
            util.writeLn(`R.count = ${TIMES};`);
            util.writeLn('while (R.count >= 0.5) {');
            util.writeLn('  R.count -= 1;');
            util.write(SUBSTACK);
            util.writeLn('}');
            util.writeLn('restore();');
        }
        else {
            util.writeLn('save();');
            util.writeLn(`R.count = ${TIMES};`);
            const label = util.addLabel();
            util.writeLn('if (R.count >= 0.5) {');
            util.writeLn('  R.count -= 1;');
            util.write(SUBSTACK);
            util.queue(label);
            util.writeLn('} else {');
            util.writeLn('  restore();');
            util.writeLn('}');
        }
    };
    statementLibrary['control_repeat_until'] = function (util) {
        const CONDITION = util.getInput('CONDITION', 'boolean');
        const SUBSTACK = util.getSubstack('SUBSTACK');
        if (util.compiler.state.isWarp && !util.substacksQueue) {
            util.writeLn(`while (!${CONDITION}) {`);
            util.write(SUBSTACK);
            util.writeLn('}');
        }
        else {
            const label = util.addLabel();
            util.writeLn(`if (!${CONDITION}) {`);
            util.write(SUBSTACK);
            util.queue(label);
            util.writeLn('}');
        }
    };
    statementLibrary['control_stop'] = function (util) {
        const STOP_OPTION = util.getField('STOP_OPTION');
        switch (STOP_OPTION) {
            case 'all':
                util.writeLn('runtime.stopAll(); return;');
                break;
            case 'this script':
                util.writeLn('endCall(); return;');
                break;
            case 'other scripts in sprite':
            case 'other scripts in stage':
                util.writeLn('for (var i = 0; i < runtime.queue.length; i++) {');
                util.writeLn('  if (i !== THREAD && runtime.queue[i] && runtime.queue[i].sprite === S) {');
                util.writeLn('    runtime.queue[i] = undefined;');
                util.writeLn('  }');
                util.writeLn('}');
                break;
        }
    };
    statementLibrary['control_wait'] = function (util) {
        const DURATION = util.getInput('DURATION', 'any');
        util.writeLn('save();');
        util.writeLn('R.start = runtime.now;');
        util.writeLn(`R.duration = ${DURATION};`);
        util.writeLn(`var first = true;`);
        const label = util.addLabel();
        util.writeLn('if (runtime.now - R.start < R.duration * 1000 || first) {');
        util.writeLn('  var first;');
        util.forceQueue(label);
        util.writeLn('}');
        util.writeLn('restore();');
    };
    statementLibrary['control_wait_until'] = function (util) {
        const CONDITION = util.getInput('CONDITION', 'boolean');
        const label = util.addLabel();
        util.writeLn(`if (!${CONDITION}) {`);
        util.forceQueue(label);
        util.writeLn('}');
    };
    statementLibrary['control_while'] = function (util) {
        const CONDITION = util.getInput('CONDITION', 'boolean');
        const SUBSTACK = util.getSubstack('SUBSTACK');
        if (util.compiler.state.isWarp && !util.substacksQueue) {
            util.writeLn(`while (${CONDITION}) {`);
            util.write(SUBSTACK);
            util.writeLn('}');
        }
        else {
            const label = util.addLabel();
            util.writeLn(`if (${CONDITION}) {`);
            util.write(SUBSTACK);
            util.queue(label);
            util.writeLn('}');
        }
    };
    statementLibrary['data_addtolist'] = function (util) {
        const LIST = util.getListReference('LIST');
        const ITEM = util.getInput('ITEM', 'any');
        util.writeLn(`${LIST}.push(${ITEM});`);
    };
    statementLibrary['data_changevariableby'] = function (util) {
        const VARIABLE = util.getVariableReference('VARIABLE');
        const VALUE = util.getInput('VALUE', 'number');
        util.writeLn(`${VARIABLE} = (${util.asType(VARIABLE, 'number')} + ${VALUE});`);
    };
    statementLibrary['data_deletealloflist'] = function (util) {
        const LIST = util.getListReference('LIST');
        util.writeLn(`${LIST}.deleteLine("all");`);
    };
    statementLibrary['data_deleteoflist'] = function (util) {
        const LIST = util.getListReference('LIST');
        const INDEX = util.getInput('INDEX', 'any');
        util.writeLn(`${LIST}.deleteLine(${INDEX});`);
    };
    statementLibrary['data_hidelist'] = function (util) {
        const LIST = util.sanitizedString(util.getField('LIST'));
        const scope = util.getListScope('LIST');
        util.writeLn(`${scope}.showVariable(${LIST}, false);`);
    };
    statementLibrary['data_hidevariable'] = function (util) {
        const VARIABLE = util.sanitizedString(util.getField('VARIABLE'));
        const scope = util.getVariableScope('VARIABLE');
        util.writeLn(`${scope}.showVariable(${VARIABLE}, false);`);
    };
    statementLibrary['data_insertatlist'] = function (util) {
        const LIST = util.getListReference('LIST');
        const ITEM = util.getInput('ITEM', 'any');
        const INDEX = util.getInput('INDEX', 'any');
        util.writeLn(`${LIST}.insert(${INDEX}, ${ITEM});`);
    };
    statementLibrary['data_replaceitemoflist'] = function (util) {
        const LIST = util.getListReference('LIST');
        const ITEM = util.getInput('ITEM', 'any');
        const INDEX = util.getInput('INDEX', 'any');
        util.writeLn(`${LIST}.set(${INDEX}, ${ITEM});`);
    };
    statementLibrary['data_setvariableto'] = function (util) {
        const VARIABLE = util.getVariableReference('VARIABLE');
        const VALUE = util.getInput('VALUE', 'any');
        util.writeLn(`${VARIABLE} = ${VALUE};`);
    };
    statementLibrary['data_showlist'] = function (util) {
        const LIST = util.sanitizedString(util.getField('LIST'));
        const scope = util.getListScope('LIST');
        util.writeLn(`${scope}.showVariable(${LIST}, true);`);
    };
    statementLibrary['data_showvariable'] = function (util) {
        const VARIABLE = util.sanitizedString(util.getField('VARIABLE'));
        const scope = util.getVariableScope('VARIABLE');
        util.writeLn(`${scope}.showVariable(${VARIABLE}, true);`);
    };
    statementLibrary['motion_turnright'] = function (util) {
        const DEGREES = util.getInput('DEGREES', 'number');
        util.writeLn(`S.setDirection(S.direction + ${DEGREES});`);
        util.visual('visible');
    };
    statementLibrary['looks_changeeffectby'] = function (util) {
        const EFFECT = util.sanitizedString(util.getField('EFFECT')).toLowerCase();
        const CHANGE = util.getInput('CHANGE', 'number');
        util.writeLn(`S.changeFilter(${EFFECT}, ${CHANGE});`);
        util.visual('visible');
    };
    statementLibrary['looks_changesizeby'] = function (util) {
        const CHANGE = util.getInput('CHANGE', 'any');
        util.writeLn(`var f = S.scale + ${CHANGE} / 100;`);
        util.writeLn('S.scale = f < 0 ? 0 : f;');
        util.visual('visible');
    };
    statementLibrary['looks_cleargraphiceffects'] = function (util) {
        util.writeLn('S.resetFilters();');
        util.visual('visible');
    };
    statementLibrary['looks_goforwardbackwardlayers'] = function (util) {
        const FORWARD_BACKWARD = util.getField('FORWARD_BACKWARD');
        const NUM = util.getInput('NUM', 'number');
        util.writeLn('var i = self.children.indexOf(S);');
        util.writeLn('if (i !== -1) {');
        util.writeLn('  self.children.splice(i, 1);');
        if (FORWARD_BACKWARD === 'forward') {
            util.writeLn(`  self.children.splice(Math.min(self.children.length - 1, i + ${NUM}), 0, S);`);
        }
        else {
            util.writeLn(`  self.children.splice(Math.max(0, i - ${NUM}), 0, S);`);
        }
        util.writeLn('}');
    };
    statementLibrary['looks_gotofrontback'] = function (util) {
        const FRONT_BACK = util.getField('FRONT_BACK');
        util.writeLn('var i = self.children.indexOf(S);');
        util.writeLn('if (i !== -1) self.children.splice(i, 1);');
        if (FRONT_BACK === 'front') {
            util.writeLn('self.children.push(S);');
        }
        else {
            util.writeLn('self.children.unshift(S);');
        }
    };
    statementLibrary['looks_hide'] = function (util) {
        util.visual('visible');
        util.writeLn('S.visible = false;');
        util.updateBubble();
    };
    statementLibrary['looks_nextbackdrop'] = function (util) {
        util.writeLn('self.showNextCostume();');
        util.visual('always');
        util.writeLn('var threads = backdropChange();');
        util.writeLn('if (threads.indexOf(BASE) !== -1) {return;}');
    };
    statementLibrary['looks_nextcostume'] = function (util) {
        util.writeLn('S.showNextCostume();');
        util.visual('visible');
    };
    statementLibrary['looks_say'] = function (util) {
        const MESSAGE = util.getInput('MESSAGE', 'any');
        util.writeLn(`S.say(${MESSAGE}, false);`);
    };
    statementLibrary['looks_sayforsecs'] = function (util) {
        const MESSAGE = util.getInput('MESSAGE', 'any');
        const SECS = util.getInput('SECS', 'number');
        util.writeLn('save();');
        util.writeLn(`R.id = S.say(${MESSAGE}, false);`);
        util.writeLn('R.start = runtime.now;');
        util.writeLn(`R.duration = ${SECS};`);
        const label = util.addLabel();
        util.writeLn('if (runtime.now - R.start < R.duration * 1000) {');
        util.forceQueue(label);
        util.writeLn('}');
        util.writeLn('if (S.sayId === R.id) {');
        util.writeLn('  S.say("");');
        util.writeLn('}');
        util.writeLn('restore();');
        util.visual('visible');
    };
    statementLibrary['looks_seteffectto'] = function (util) {
        const EFFECT = util.sanitizedString(util.getField('EFFECT')).toLowerCase();
        const VALUE = util.getInput('VALUE', 'number');
        util.writeLn(`S.setFilter(${EFFECT}, ${VALUE});`);
        util.visual('visible');
    };
    statementLibrary['looks_setsizeto'] = function (util) {
        const SIZE = util.getInput('SIZE', 'number');
        util.writeLn(`S.scale = Math.max(0, ${SIZE} / 100);`);
        util.visual('visible');
    };
    statementLibrary['looks_show'] = function (util) {
        util.writeLn('S.visible = true;');
        util.visual('always');
        util.updateBubble();
    };
    statementLibrary['looks_switchbackdropto'] = function (util) {
        const BACKDROP = util.getInput('BACKDROP', 'any');
        util.writeLn(`self.setCostume(${BACKDROP});`);
        util.visual('always');
        util.writeLn('var threads = backdropChange();');
        util.writeLn('if (threads.indexOf(BASE) !== -1) {return;}');
    };
    statementLibrary['looks_switchcostumeto'] = function (util) {
        const COSTUME = util.getInput('COSTUME', 'any');
        util.writeLn(`S.setCostume(${COSTUME});`);
        util.visual('visible');
    };
    statementLibrary['looks_think'] = function (util) {
        const MESSAGE = util.getInput('MESSAGE', 'any');
        util.writeLn(`S.say(${MESSAGE}, true);`);
        util.visual('visible');
    };
    statementLibrary['looks_thinkforsecs'] = function (util) {
        const MESSAGE = util.getInput('MESSAGE', 'any');
        const SECS = util.getInput('SECS', 'number');
        util.writeLn('save();');
        util.writeLn(`R.id = S.say(${MESSAGE}, true);`);
        util.writeLn('R.start = runtime.now;');
        util.writeLn(`R.duration = ${SECS};`);
        const label = util.addLabel();
        util.writeLn('if (runtime.now - R.start < R.duration * 1000) {');
        util.forceQueue(label);
        util.writeLn('}');
        util.writeLn('if (S.sayId === R.id) {');
        util.writeLn('  S.say("");');
        util.writeLn('}');
        util.writeLn('restore();');
        util.visual('visible');
    };
    statementLibrary['motion_changexby'] = function (util) {
        const DX = util.getInput('DX', 'number');
        util.writeLn(`S.moveTo(S.scratchX + ${DX}, S.scratchY);`);
        util.visual('drawing');
    };
    statementLibrary['motion_changeyby'] = function (util) {
        const DY = util.getInput('DY', 'number');
        util.writeLn(`S.moveTo(S.scratchX, S.scratchY + ${DY});`);
        util.visual('drawing');
    };
    statementLibrary['motion_glidesecstoxy'] = function (util) {
        const SECS = util.getInput('SECS', 'any');
        const X = util.getInput('X', 'any');
        const Y = util.getInput('Y', 'any');
        util.visual('drawing');
        util.writeLn('save();');
        util.writeLn('R.start = runtime.now;');
        util.writeLn(`R.duration = ${SECS};`);
        util.writeLn('R.baseX = S.scratchX;');
        util.writeLn('R.baseY = S.scratchY;');
        util.writeLn(`R.deltaX = ${X} - S.scratchX;`);
        util.writeLn(`R.deltaY = ${Y} - S.scratchY;`);
        const label = util.addLabel();
        util.writeLn('var f = (runtime.now - R.start) / (R.duration * 1000);');
        util.writeLn('if (f > 1) f = 1;');
        util.writeLn('S.moveTo(R.baseX + f * R.deltaX, R.baseY + f * R.deltaY);');
        util.writeLn('if (f < 1) {');
        util.forceQueue(label);
        util.writeLn('}');
        util.writeLn('restore();');
    };
    statementLibrary['motion_glideto'] = function (util) {
        const SECS = util.getInput('SECS', 'any');
        const TO = util.getInput('TO', 'any');
        util.visual('drawing');
        util.writeLn('save();');
        util.writeLn('R.start = runtime.now;');
        util.writeLn(`R.duration = ${SECS};`);
        util.writeLn('R.baseX = S.scratchX;');
        util.writeLn('R.baseY = S.scratchY;');
        util.writeLn(`var to = self.getPosition(${TO});`);
        util.writeLn('if (to) {');
        util.writeLn('  R.deltaX = to.x - S.scratchX;');
        util.writeLn('  R.deltaY = to.y - S.scratchY;');
        const label = util.addLabel();
        util.writeLn('  var f = (runtime.now - R.start) / (R.duration * 1000);');
        util.writeLn('  if (f > 1 || isNaN(f)) f = 1;');
        util.writeLn('  S.moveTo(R.baseX + f * R.deltaX, R.baseY + f * R.deltaY);');
        util.writeLn('  if (f < 1) {');
        util.forceQueue(label);
        util.writeLn('  }');
        util.writeLn('  restore();');
        util.writeLn('}');
    };
    statementLibrary['motion_goto'] = function (util) {
        const TO = util.getInput('TO', 'any');
        util.writeLn(`S.gotoObject(${TO});`);
        util.visual('drawing');
    };
    statementLibrary['motion_gotoxy'] = function (util) {
        const X = util.getInput('X', 'number');
        const Y = util.getInput('Y', 'number');
        util.writeLn(`S.moveTo(${X}, ${Y});`);
        util.visual('drawing');
    };
    statementLibrary['motion_ifonedgebounce'] = function (util) {
        // TODO: set visual if bounced
        util.writeLn('S.bounceOffEdge();');
    };
    statementLibrary['motion_movesteps'] = function (util) {
        const STEPS = util.getInput('STEPS', 'number');
        util.writeLn(`S.forward(${STEPS});`);
        util.visual('drawing');
    };
    statementLibrary['motion_pointindirection'] = function (util) {
        const DIRECTION = util.getInput('DIRECTION', 'number');
        util.visual('visible');
        util.writeLn(`S.direction = ${DIRECTION};`);
    };
    statementLibrary['motion_pointtowards'] = function (util) {
        const TOWARDS = util.getInput('TOWARDS', 'any');
        util.writeLn(`S.pointTowards(${TOWARDS});`);
        util.visual('visible');
    };
    statementLibrary['motion_setrotationstyle'] = function (util) {
        const STYLE = P.utils.parseRotationStyle(util.getField('STYLE'));
        util.writeLn(`S.rotationStyle = ${STYLE};`);
        util.visual('visible');
    };
    statementLibrary['motion_setx'] = function (util) {
        const X = util.getInput('X', 'number');
        util.writeLn(`S.moveTo(${X}, S.scratchY);`);
        util.visual('drawing');
    };
    statementLibrary['motion_sety'] = function (util) {
        const Y = util.getInput('Y', 'number');
        util.writeLn(`S.moveTo(S.scratchX, ${Y});`);
        util.visual('drawing');
    };
    statementLibrary['motion_turnleft'] = function (util) {
        const DEGREES = util.getInput('DEGREES', 'number');
        util.writeLn(`S.setDirection(S.direction - ${DEGREES});`);
        util.visual('visible');
    };
    statementLibrary['music_changeTempo'] = function (util) {
        const TEMPO = util.getInput('TEMPO', 'number');
        util.writeLn(`self.tempoBPM += ${TEMPO};`);
    };
    statementLibrary['music_setTempo'] = function (util) {
        const TEMPO = util.getInput('TEMPO', 'number');
        util.writeLn(`self.tempoBPM = ${TEMPO};`);
    };
    statementLibrary['sound_changevolumeby'] = function (util) {
        const VOLUME = util.getInput('VOLUME', 'number');
        util.writeLn(`S.volume = Math.max(0, Math.min(1, S.volume + ${VOLUME} / 100));`);
        util.writeLn('if (S.node) S.node.gain.value = S.volume;');
    };
    statementLibrary['sound_play'] = function (util) {
        const SOUND_MENU = util.getInput('SOUND_MENU', 'any');
        if (P.audio.context) {
            util.writeLn(`var sound = S.getSound(${SOUND_MENU});`);
            util.writeLn('if (sound) {');
            util.writeLn('  playSound(sound);');
            util.writeLn('}');
        }
    };
    statementLibrary['sound_playuntildone'] = function (util) {
        const SOUND_MENU = util.getInput('SOUND_MENU', 'any');
        if (P.audio.context) {
            util.writeLn(`var sound = S.getSound(${SOUND_MENU});`);
            util.writeLn('if (sound) {');
            util.writeLn('  playSound(sound);');
            util.writeLn('  runtime.playingSounds++;');
            util.writeLn('  save();');
            util.writeLn('  R.sound = sound;');
            util.writeLn('  R.start = runtime.now;');
            util.writeLn('  R.duration = sound.duration;');
            util.writeLn('  var first = true;');
            const label = util.addLabel();
            util.writeLn('  if ((runtime.now - R.start < R.duration * 1000 || first) && runtime.stopSounds === 0) {');
            util.writeLn('    var first;');
            util.forceQueue(label);
            util.writeLn('  }');
            util.writeLn('  if (runtime.stopSounds) runtime.stopSounds--;');
            util.writeLn('  runtime.playingSounds--;');
            util.writeLn('  restore();');
            util.writeLn('}');
        }
    };
    statementLibrary['sound_setvolumeto'] = function (util) {
        const VOLUME = util.getInput('VOLUME', 'number');
        util.writeLn(`S.volume = Math.max(0, Math.min(1, ${VOLUME} / 100));`);
        util.writeLn('if (S.node) S.node.gain.value = S.volume;');
    };
    statementLibrary['sound_stopallsounds'] = function (util) {
        if (P.audio.context) {
            util.writeLn('self.stopAllSounds();');
        }
    };
    statementLibrary['event_broadcast'] = function (util) {
        const BROADCAST_INPUT = util.getInput('BROADCAST_INPUT', 'any');
        util.writeLn(`var threads = broadcast(${BROADCAST_INPUT});`);
        util.writeLn('if (threads.indexOf(BASE) !== -1) {return;}');
    };
    statementLibrary['event_broadcastandwait'] = function (util) {
        const BROADCAST_INPUT = util.getInput('BROADCAST_INPUT', 'any');
        util.writeLn('save();');
        util.writeLn(`R.threads = broadcast(${BROADCAST_INPUT});`);
        util.writeLn('if (R.threads.indexOf(BASE) !== -1) {return;}');
        const label = util.addLabel();
        util.writeLn('if (running(R.threads)) {');
        util.forceQueue(label);
        util.writeLn('}');
        util.writeLn('restore();');
    };
    statementLibrary['pen_changePenColorParamBy'] = function (util) {
        const COLOR_PARAM = util.getInput('COLOR_PARAM', 'string');
        const VALUE = util.getInput('VALUE', 'number');
        util.writeLn(`S.changePenColorParam(${COLOR_PARAM}, ${VALUE});`);
    };
    statementLibrary['pen_changePenHueBy'] = function (util) {
        // This is an old pen hue block, which functions differently from the new one.
        const HUE = util.getInput('HUE', 'number');
        util.writeLn('S.setPenColorHSL();');
        util.writeLn(`S.penHue += ${HUE} * 360 / 200;`);
        util.writeLn('S.penSaturation = 100;');
    };
    statementLibrary['pen_changePenShadeBy'] = function (util) {
        const SHADE = util.getInput('SHADE', 'number');
        util.writeLn('S.setPenColorHSL();');
        util.writeLn(`S.penLightness = (S.penLightness + ${SHADE}) % 200;`);
        util.writeLn('if (S.penLightness < 0) S.penLightness += 200;');
        util.writeLn('S.saturation = 100;');
    };
    statementLibrary['pen_changePenSizeBy'] = function (util) {
        const SIZE = util.getInput('SIZE', 'number');
        util.writeLn(`S.penSize = Math.max(1, S.penSize + ${SIZE});`);
    };
    statementLibrary['pen_clear'] = function (util) {
        util.writeLn('self.clearPen();');
        util.visual('always');
    };
    statementLibrary['pen_penDown'] = function (util) {
        util.writeLn('S.isPenDown = true;');
        util.writeLn('S.dotPen();');
        util.visual('always');
    };
    statementLibrary['pen_penUp'] = function (util) {
        // TODO: determine visual variant
        // definitely not 'always' or 'visible', might be a 'if (S.isPenDown)'
        util.writeLn('S.isPenDown = false;');
    };
    statementLibrary['pen_setPenColorParamTo'] = function (util) {
        const COLOR_PARAM = util.getInput('COLOR_PARAM', 'string');
        const VALUE = util.getInput('VALUE', 'number');
        util.writeLn(`S.setPenColorParam(${COLOR_PARAM}, ${VALUE});`);
    };
    statementLibrary['pen_setPenColorToColor'] = function (util) {
        const COLOR = util.getInput('COLOR', 'number');
        util.writeLn(`S.setPenColor(${COLOR});`);
    };
    statementLibrary['pen_setPenHueToNumber'] = function (util) {
        // This is an old pen hue block, which functions differently from the new one.
        const HUE = util.getInput('HUE', 'number');
        util.writeLn('S.setPenColorHSL();');
        util.writeLn(`S.penHue = ${HUE} * 360 / 200;`);
        util.writeLn('S.penSaturation = 100;');
    };
    statementLibrary['pen_setPenShadeToNumber'] = function (util) {
        const SHADE = util.getInput('SHADE', 'number');
        util.writeLn('S.setPenColorHSL();');
        util.writeLn(`S.penLightness = ${SHADE} % 200;`);
        util.writeLn('if (S.penLightness < 0) S.penLightness += 200;');
        util.writeLn('S.saturation = 100;');
    };
    statementLibrary['pen_setPenSizeTo'] = function (util) {
        const SIZE = util.getInput('SIZE', 'number');
        util.writeLn(`S.penSize = Math.max(1, ${SIZE});`);
    };
    statementLibrary['pen_stamp'] = function (util) {
        util.writeLn('S.stamp();');
        util.visual('always');
    };
    statementLibrary['procedures_call'] = function (util) {
        const mutation = util.block.mutation;
        const name = mutation.proccode;
        if (P.config.debug && name === 'forkphorus:debugger;') {
            util.writeLn('/* forkphorus debugger */ debugger;');
            return;
        }
        const label = util.claimNextLabel();
        util.write(`call(S.procedures[${util.sanitizedString(name)}], ${label}, [`);
        // The mutation has a stringified JSON list of input IDs... it's weird.
        const inputNames = JSON.parse(mutation.argumentids);
        for (const inputName of inputNames) {
            util.write(`${util.getInput(inputName, 'any')}, `);
        }
        util.writeLn(']); return;');
        util.addLabel(label);
    };
    statementLibrary['sensing_askandwait'] = function (util) {
        const QUESTION = util.getInput('QUESTION', 'string');
        util.writeLn('R.id = self.nextPromptId++;');
        const label1 = util.addLabel();
        util.writeLn('if (self.promptId < R.id) {');
        util.forceQueue(label1);
        util.writeLn('}');
        util.writeLn(`S.ask(${QUESTION});`);
        const label2 = util.addLabel();
        util.writeLn('if (self.promptId === R.id) {');
        util.forceQueue(label2);
        util.writeLn('}');
        util.visual('always');
    };
    statementLibrary['sensing_resettimer'] = function (util) {
        util.writeLn('runtime.timerStart = runtime.now;');
    };
    statementLibrary['sensing_setdragmode'] = function (util) {
        const DRAG_MODE = util.getField('DRAG_MODE');
        if (DRAG_MODE === 'draggable') {
            util.writeLn('S.isDraggable = true;');
        }
        else {
            util.writeLn('S.isDraggable = false;');
        }
    };
    // Legacy no-ops
    // https://github.com/LLK/scratch-vm/blob/bb42c0019c60f5d1947f3432038aa036a0fddca6/src/blocks/scratch3_motion.js#L19
    // https://github.com/LLK/scratch-vm/blob/bb42c0019c60f5d1947f3432038aa036a0fddca6/src/blocks/scratch3_looks.js#L248
    const noopStatement = (util) => util.writeLn('/* noop */');
    statementLibrary['motion_align_scene'] = noopStatement;
    statementLibrary['motion_scroll_right'] = noopStatement;
    statementLibrary['motion_scroll_up'] = noopStatement;
    statementLibrary['looks_changestretchby'] = noopStatement;
    statementLibrary['looks_hideallsprites'] = noopStatement;
    statementLibrary['looks_setstretchto'] = noopStatement;
    /* Inputs */
    inputLibrary['argument_reporter_boolean'] = function (util) {
        const VALUE = util.sanitizedString(util.getField('VALUE'));
        return util.booleanInput(util.asType(`C.args[${VALUE}]`, 'boolean'));
    };
    inputLibrary['argument_reporter_string_number'] = function (util) {
        const VALUE = util.sanitizedString(util.getField('VALUE'));
        return util.anyInput(`C.args[${VALUE}]`);
    };
    inputLibrary['control_create_clone_of_menu'] = function (util) {
        return util.fieldInput('CLONE_OPTION');
    };
    inputLibrary['control_get_counter'] = function (util) {
        return util.numberInput('self.counter');
    };
    inputLibrary['data_itemoflist'] = function (util) {
        const LIST = util.getListReference('LIST');
        const INDEX = util.getInput('INDEX', 'any');
        return util.anyInput(`getLineOfList(${LIST}, ${INDEX})`);
    };
    inputLibrary['data_itemnumoflist'] = function (util) {
        const LIST = util.getListReference('LIST');
        const ITEM = util.getInput('ITEM', 'any');
        return util.numberInput(`listIndexOf(${LIST}, ${ITEM})`);
    };
    inputLibrary['data_lengthoflist'] = function (util) {
        const LIST = util.getListReference('LIST');
        return util.numberInput(`${LIST}.length`);
    };
    inputLibrary['data_listcontainsitem'] = function (util) {
        const LIST = util.getListReference('LIST');
        const ITEM = util.getInput('ITEM', 'any');
        return util.booleanInput(`listContains(${LIST}, ${ITEM})`);
    };
    inputLibrary['looks_backdropnumbername'] = function (util) {
        const NUMBER_NAME = util.getField('NUMBER_NAME');
        if (NUMBER_NAME === 'number') {
            return util.numberInput('(self.currentCostumeIndex + 1)');
        }
        else {
            return util.stringInput('self.costumes[self.currentCostumeIndex].name');
        }
    };
    inputLibrary['looks_backdrops'] = function (util) {
        return util.fieldInput('BACKDROP');
    };
    inputLibrary['looks_costume'] = function (util) {
        return util.fieldInput('COSTUME');
    };
    inputLibrary['looks_costumenumbername'] = function (util) {
        const NUMBER_NAME = util.getField('NUMBER_NAME');
        if (NUMBER_NAME === 'number') {
            return util.numberInput('(S.currentCostumeIndex + 1)');
        }
        else {
            return util.stringInput('S.costumes[S.currentCostumeIndex].name');
        }
    };
    inputLibrary['looks_size'] = function (util) {
        return util.numberInput('(S.scale * 100)');
    };
    inputLibrary['makeymakey_menu_KEY'] = function (util) {
        return util.fieldInput('KEY');
    };
    inputLibrary['matrix'] = function (util) {
        return util.fieldInput('MATRIX');
    };
    inputLibrary['motion_direction'] = function (util) {
        return util.numberInput('S.direction');
    };
    inputLibrary['motion_glideto_menu'] = function (util) {
        return util.fieldInput('TO');
    };
    inputLibrary['motion_goto_menu'] = function (util) {
        return util.fieldInput('TO');
    };
    inputLibrary['motion_pointtowards_menu'] = function (util) {
        return util.fieldInput('TOWARDS');
    };
    inputLibrary['motion_xposition'] = function (util) {
        return util.numberInput('S.scratchX');
    };
    inputLibrary['motion_yposition'] = function (util) {
        return util.numberInput('S.scratchY');
    };
    inputLibrary['music_getTempo'] = function (util) {
        return util.numberInput('self.tempoBPM');
    };
    inputLibrary['operator_add'] = function (util) {
        const NUM1 = util.getInput('NUM1', 'number');
        const NUM2 = util.getInput('NUM2', 'number');
        return util.numberInput(`(${NUM1} + ${NUM2} || 0)`);
    };
    inputLibrary['operator_and'] = function (util) {
        const OPERAND1 = util.getInput('OPERAND1', 'any');
        const OPERAND2 = util.getInput('OPERAND2', 'any');
        return util.booleanInput(`(${OPERAND1} && ${OPERAND2})`);
    };
    inputLibrary['operator_contains'] = function (util) {
        const STRING1 = util.getInput('STRING1', 'string');
        const STRING2 = util.getInput('STRING2', 'string');
        // TODO: case sensitivity?
        // TODO: use indexOf?
        return util.booleanInput(`${STRING1}.includes(${STRING2})`);
    };
    inputLibrary['operator_divide'] = function (util) {
        const NUM1 = util.getInput('NUM1', 'number');
        const NUM2 = util.getInput('NUM2', 'number');
        return util.numberInput(`(${NUM1} / ${NUM2} || 0)`);
    };
    inputLibrary['operator_equals'] = function (util) {
        const OPERAND1 = util.getInput('OPERAND1', 'any');
        const OPERAND2 = util.getInput('OPERAND2', 'any');
        return util.booleanInput(`equal(${OPERAND1}, ${OPERAND2})`);
    };
    inputLibrary['operator_gt'] = function (util) {
        const OPERAND1 = util.getInput('OPERAND1', 'any');
        const OPERAND2 = util.getInput('OPERAND2', 'any');
        // TODO: use numGreater?
        return util.booleanInput(`(compare(${OPERAND1}, ${OPERAND2}) === 1)`);
    };
    inputLibrary['operator_join'] = function (util) {
        const STRING1 = util.getInput('STRING1', 'string');
        const STRING2 = util.getInput('STRING2', 'string');
        return util.stringInput(`(${STRING1} + ${STRING2})`);
    };
    inputLibrary['operator_length'] = function (util) {
        const STRING = util.getInput('STRING', 'string');
        // TODO: parenthesis important?
        return util.numberInput(`(${STRING}).length`);
    };
    inputLibrary['operator_letter_of'] = function (util) {
        const STRING = util.getInput('STRING', 'string');
        const LETTER = util.getInput('LETTER', 'number');
        return util.stringInput(`((${STRING})[(${LETTER} | 0) - 1] || "")`);
    };
    inputLibrary['operator_lt'] = function (util) {
        const OPERAND1 = util.getInput('OPERAND1', 'any');
        const OPERAND2 = util.getInput('OPERAND2', 'any');
        // TODO: use numLess?
        return util.booleanInput(`(compare(${OPERAND1}, ${OPERAND2}) === -1)`);
    };
    inputLibrary['operator_mathop'] = function (util) {
        const OPERATOR = util.getField('OPERATOR');
        const NUM = util.getInput('NUM', 'number');
        switch (OPERATOR) {
            case 'abs':
                return util.numberInput(`Math.abs(${NUM})`);
            case 'floor':
                return util.numberInput(`Math.floor(${NUM})`);
            case 'sqrt':
                return util.numberInput(`Math.sqrt(${NUM})`);
            case 'ceiling':
                return util.numberInput(`Math.ceil(${NUM})`);
            case 'cos':
                return util.numberInput(`Math.cos(${NUM} * Math.PI / 180)`);
            case 'sin':
                return util.numberInput(`Math.sin(${NUM} * Math.PI / 180)`);
            case 'tan':
                return util.numberInput(`Math.tan(${NUM} * Math.PI / 180)`);
            case 'asin':
                return util.numberInput(`(Math.asin(${NUM}) * 180 / Math.PI)`);
            case 'acos':
                return util.numberInput(`(Math.acos(${NUM}) * 180 / Math.PI)`);
            case 'atan':
                return util.numberInput(`(Math.atan(${NUM}) * 180 / Math.PI)`);
            case 'ln':
                return util.numberInput(`Math.log(${NUM})`);
            case 'log':
                return util.numberInput(`(Math.log(${NUM}) / Math.LN10)`);
            case 'e ^':
                return util.numberInput(`Math.exp(${NUM})`);
            case '10 ^':
                return util.numberInput(`Math.exp(${NUM} * Math.LN10)`);
            default:
                return util.numberInput('0');
        }
    };
    inputLibrary['operator_mod'] = function (util) {
        const NUM1 = util.getInput('NUM1', 'number');
        const NUM2 = util.getInput('NUM2', 'number');
        return util.numberInput(`mod(${NUM1}, ${NUM2})`);
    };
    inputLibrary['operator_multiply'] = function (util) {
        const NUM1 = util.getInput('NUM1', 'number');
        const NUM2 = util.getInput('NUM2', 'number');
        return util.numberInput(`(${NUM1} * ${NUM2} || 0)`);
    };
    inputLibrary['operator_not'] = function (util) {
        const OPERAND = util.getInput('OPERAND', 'any');
        return util.booleanInput(`!${OPERAND}`);
    };
    inputLibrary['operator_or'] = function (util) {
        const OPERAND1 = util.getInput('OPERAND1', 'any');
        const OPERAND2 = util.getInput('OPERAND2', 'any');
        return util.booleanInput(`(${OPERAND1} || ${OPERAND2})`);
    };
    inputLibrary['operator_random'] = function (util) {
        const FROM = util.getInput('FROM', 'number');
        const TO = util.getInput('TO', 'number');
        return util.numberInput(`random(${FROM}, ${TO})`);
    };
    inputLibrary['operator_round'] = function (util) {
        const NUM = util.getInput('NUM', 'number');
        return util.numberInput(`Math.round(${NUM})`);
    };
    inputLibrary['operator_subtract'] = function (util) {
        const NUM1 = util.getInput('NUM1', 'number');
        const NUM2 = util.getInput('NUM2', 'number');
        return util.numberInput(`(${NUM1} - ${NUM2} || 0)`);
    };
    inputLibrary['pen_menu_colorParam'] = function (util) {
        return util.fieldInput('colorParam');
    };
    inputLibrary['sensing_answer'] = function (util) {
        return util.stringInput('self.answer');
    };
    inputLibrary['sensing_coloristouchingcolor'] = function (util) {
        const COLOR = util.getInput('COLOR', 'any');
        const COLOR2 = util.getInput('COLOR2', 'any');
        return util.booleanInput(`S.colorTouchingColor(${COLOR}, ${COLOR2})`);
    };
    inputLibrary['sensing_current'] = function (util) {
        const CURRENTMENU = util.getField('CURRENTMENU').toLowerCase();
        switch (CURRENTMENU) {
            case 'year': return util.numberInput('new Date().getFullYear()');
            case 'month': return util.numberInput('(new Date().getMonth() + 1)');
            case 'date': return util.numberInput('new Date().getDate()');
            case 'dayofweek': return util.numberInput('(new Date().getDay() + 1)');
            case 'hour': return util.numberInput('new Date().getHours()');
            case 'minute': return util.numberInput('new Date().getMinutes()');
            case 'second': return util.numberInput('new Date().getSeconds()');
        }
        return util.numberInput('0');
    };
    inputLibrary['sensing_dayssince2000'] = function (util) {
        return util.numberInput('((Date.now() - epoch) / 86400000)');
    };
    inputLibrary['sensing_distanceto'] = function (util) {
        const DISTANCETOMENU = util.getInput('DISTANCETOMENU', 'any');
        return util.numberInput(`S.distanceTo(${DISTANCETOMENU})`);
    };
    inputLibrary['sensing_distancetomenu'] = function (util) {
        return util.fieldInput('DISTANCETOMENU');
    };
    inputLibrary['sensing_keyoptions'] = function (util) {
        return util.fieldInput('KEY_OPTION');
    };
    inputLibrary['sensing_keypressed'] = function (util) {
        const KEY_OPTION = util.getInput('KEY_OPTION', 'any');
        return util.booleanInput(`!!self.keys[P.runtime.getKeyCode(${KEY_OPTION})]`);
    };
    inputLibrary['sensing_loud'] = function (util) {
        // see sensing_loudness above
        return util.booleanInput('false');
    };
    inputLibrary['sensing_loudness'] = function (util) {
        // We don't implement loudness, we always return -1 which indicates that there is no microphone available.
        return util.numberInput('-1');
    };
    inputLibrary['sensing_mousedown'] = function (util) {
        return util.booleanInput('self.mousePressed');
    };
    inputLibrary['sensing_mousex'] = function (util) {
        return util.numberInput('self.mouseX');
    };
    inputLibrary['sensing_mousey'] = function (util) {
        return util.numberInput('self.mouseY');
    };
    inputLibrary['sensing_of'] = function (util) {
        const PROPERTY = util.sanitizedString(util.getField('PROPERTY'));
        const OBJECT = util.getInput('OBJECT', 'string');
        return util.anyInput(`attribute(${PROPERTY}, ${OBJECT})`);
    };
    inputLibrary['sensing_of_object_menu'] = function (util) {
        return util.fieldInput('OBJECT');
    };
    inputLibrary['sensing_timer'] = function (util) {
        if (P.config.preciseTimers) {
            return util.numberInput('((runtime.rightNow() - runtime.timerStart) / 1000)');
        }
        else {
            return util.numberInput('((runtime.now - runtime.timerStart) / 1000)');
        }
    };
    inputLibrary['sensing_touchingcolor'] = function (util) {
        const COLOR = util.getInput('COLOR', 'any');
        return util.booleanInput(`S.touchingColor(${COLOR})`);
    };
    inputLibrary['sensing_touchingobject'] = function (util) {
        const TOUCHINGOBJECTMENU = util.getInput('TOUCHINGOBJECTMENU', 'string');
        return util.booleanInput(`S.touching(${TOUCHINGOBJECTMENU})`);
    };
    inputLibrary['sensing_touchingobjectmenu'] = function (util) {
        return util.fieldInput('TOUCHINGOBJECTMENU');
    };
    inputLibrary['sound_sounds_menu'] = function (util) {
        return util.fieldInput('SOUND_MENU');
    };
    inputLibrary['sensing_username'] = function (util) {
        return util.stringInput('self.username');
    };
    inputLibrary['sound_volume'] = function (util) {
        return util.numberInput('(S.volume * 100)');
    };
    // Legacy no-ops
    // https://github.com/LLK/scratch-vm/blob/bb42c0019c60f5d1947f3432038aa036a0fddca6/src/blocks/scratch3_sensing.js#L74
    // https://github.com/LLK/scratch-vm/blob/bb42c0019c60f5d1947f3432038aa036a0fddca6/src/blocks/scratch3_motion.js#L42-L43
    const noopInput = (util) => util.anyInput('undefined');
    inputLibrary['motion_yscroll'] = noopInput;
    inputLibrary['motion_xscroll'] = noopInput;
    inputLibrary['sensing_userid'] = noopInput;
    /* Hats */
    hatLibrary['control_start_as_clone'] = {
        handle(util) {
            util.target.listeners.whenCloned.push(util.startingFunction);
        },
    };
    hatLibrary['event_whenbackdropswitchesto'] = {
        handle(util) {
            const BACKDROP = util.getField('BACKDROP');
            if (!util.target.listeners.whenBackdropChanges[BACKDROP]) {
                util.target.listeners.whenBackdropChanges[BACKDROP] = [];
            }
            util.target.listeners.whenBackdropChanges[BACKDROP].push(util.startingFunction);
        },
    };
    hatLibrary['event_whenbroadcastreceived'] = {
        handle(util) {
            const BROADCAST_OPTION = util.getField('BROADCAST_OPTION').toLowerCase();
            if (!util.target.listeners.whenIReceive[BROADCAST_OPTION]) {
                util.target.listeners.whenIReceive[BROADCAST_OPTION] = [];
            }
            util.target.listeners.whenIReceive[BROADCAST_OPTION].push(util.startingFunction);
        },
    };
    hatLibrary['event_whenflagclicked'] = {
        handle(util) {
            util.target.listeners.whenGreenFlag.push(util.startingFunction);
        },
    };
    hatLibrary['event_whenkeypressed'] = {
        handle(util) {
            const KEY_OPTION = util.getField('KEY_OPTION');
            if (KEY_OPTION === 'any') {
                for (var i = 128; i--;) {
                    util.target.listeners.whenKeyPressed[i].push(util.startingFunction);
                }
            }
            else {
                util.target.listeners.whenKeyPressed[P.runtime.getKeyCode(KEY_OPTION)].push(util.startingFunction);
            }
        },
    };
    hatLibrary['event_whenstageclicked'] = {
        handle(util) {
            util.target.listeners.whenClicked.push(util.startingFunction);
        },
    };
    hatLibrary['event_whenthisspriteclicked'] = {
        handle(util) {
            util.target.listeners.whenClicked.push(util.startingFunction);
        },
    };
    hatLibrary['makeymakey_whenMakeyKeyPressed'] = {
        handle(util) {
            // TODO: support all other keys
            // TODO: support patterns
            // Will probably be implemented as a very *interesting* "when any key pressed" handler
            // TODO: support all inputs
            const KEY = util.getInput('KEY', 'any');
            const keyMap = {
                // The key will be a full expression, including quotes around strings.
                '"SPACE"': 'space',
                '"UP"': 'up arrow',
                '"DOWN"': 'down arrow',
                '"LEFT"': 'left arrow',
                '"RIGHT"': 'right arrow',
                '"w"': 'w',
                '"a"': 'a',
                '"s"': 's',
                '"d"': 'd',
                '"f"': 'f',
                '"g"': 'g',
            };
            if (keyMap.hasOwnProperty(KEY)) {
                const keyCode = P.runtime.getKeyCode(keyMap[KEY]);
                util.target.listeners.whenKeyPressed[keyCode].push(util.startingFunction);
            }
            else {
                util.compiler.warn('unknown makey makey key', KEY);
            }
        },
    };
    hatLibrary['procedures_definition'] = {
        handle(util) {
            // TODO: HatUtil helpers for this
            const customBlockId = util.block.inputs.custom_block[1];
            const mutation = util.compiler.blocks[customBlockId].mutation;
            const proccode = mutation.proccode;
            // Warp is either a boolean or a string representation of that boolean for some reason.
            const warp = typeof mutation.warp === 'string' ? mutation.warp === 'true' : mutation.warp;
            // It's a stringified JSON array.
            const argumentNames = JSON.parse(mutation.argumentnames);
            const procedure = new P.sb3.Scratch3Procedure(util.startingFunction, warp, argumentNames);
            util.target.procedures[proccode] = procedure;
        },
        postcompile(compiler, source, hat) {
            return source + 'endCall(); return;\n';
        },
        precompile(compiler, hat) {
            const customBlockId = hat.inputs.custom_block[1];
            const mutation = compiler.blocks[customBlockId].mutation;
            const warp = typeof mutation.warp === 'string' ? mutation.warp === 'true' : mutation.warp;
            if (warp) {
                compiler.state.isWarp = true;
            }
        },
    };
    /* Watchers */
    watcherLibrary['data_variable'] = {
        init(watcher) {
            const name = watcher.params.VARIABLE;
            watcher.target.watchers[name] = watcher;
        },
        set(watcher, value) {
            const name = watcher.params.VARIABLE;
            watcher.target.vars[name] = value;
        },
        evaluate(watcher) {
            const name = watcher.params.VARIABLE;
            return watcher.target.vars[name];
        },
        getLabel(watcher) {
            return watcher.params.VARIABLE;
        },
    };
    watcherLibrary['looks_backdropnumbername'] = {
        evaluate(watcher) {
            const target = watcher.stage;
            const param = watcher.params.NUMBER_NAME;
            if (param === 'number') {
                return target.currentCostumeIndex + 1;
            }
            else {
                return target.costumes[target.currentCostumeIndex].name;
            }
        },
        getLabel(watcher) {
            return 'backdrop ' + watcher.params.NUMBER_NAME;
        },
    };
    watcherLibrary['looks_costumenumbername'] = {
        evaluate(watcher) {
            const target = watcher.target;
            const param = watcher.params.NUMBER_NAME;
            if (param === 'number') {
                return target.currentCostumeIndex + 1;
            }
            else {
                return target.costumes[target.currentCostumeIndex].name;
            }
        },
        getLabel(watcher) {
            return 'costume ' + watcher.params.NUMBER_NAME;
        },
    };
    watcherLibrary['looks_size'] = {
        evaluate(watcher) { return P.core.isSprite(watcher.target) ? watcher.target.scale * 100 : 100; },
        getLabel() { return 'size'; },
    };
    watcherLibrary['motion_direction'] = {
        evaluate(watcher) { return P.core.isSprite(watcher.target) ? watcher.target.direction : 0; },
        getLabel() { return 'direction'; },
    };
    watcherLibrary['motion_xposition'] = {
        evaluate(watcher) { return watcher.target.scratchX; },
        getLabel() { return 'x position'; },
    };
    watcherLibrary['motion_yposition'] = {
        evaluate(watcher) { return watcher.target.scratchY; },
        getLabel() { return 'y position'; },
    };
    watcherLibrary['music_getTempo'] = {
        evaluate(watcher) { return watcher.stage.tempoBPM; },
        getLabel() { return 'Music: tempo'; },
    };
    watcherLibrary['sensing_answer'] = {
        evaluate(watcher) { return watcher.stage.answer; },
        getLabel() { return 'answer'; },
    };
    watcherLibrary['sensing_current'] = {
        evaluate(watcher) {
            const param = watcher.params.CURRENTMENU.toLowerCase();
            switch (param) {
                case 'year': return new Date().getFullYear();
                case 'month': return new Date().getMonth() + 1;
                case 'date': return new Date().getDate();
                case 'dayofweek': return new Date().getDay() + 1;
                case 'hour': return new Date().getHours();
                case 'minute': return new Date().getMinutes();
                case 'second': return new Date().getSeconds();
            }
            return 0;
        },
        getLabel(watcher) {
            const param = watcher.params.CURRENTMENU.toLowerCase();
            // all expected params except DAYOFWEEK can just be lowercased and used directly
            if (param === 'dayofweek') {
                return 'day of week';
            }
            return param;
        }
    };
    watcherLibrary['sensing_loudness'] = {
        // We don't implement loudness.
        evaluate() { return -1; },
        getLabel() { return 'loudness'; },
    };
    watcherLibrary['sensing_timer'] = {
        evaluate(watcher) {
            return (watcher.stage.runtime.now - watcher.stage.runtime.timerStart) / 1000;
        },
        getLabel() { return 'timer'; },
    };
    watcherLibrary['sensing_username'] = {
        evaluate(watcher) { return watcher.stage.username; },
        getLabel() { return 'username'; },
    };
    watcherLibrary['sound_volume'] = {
        evaluate(watcher) { return watcher.target.volume * 100; },
        getLabel() { return 'volume'; },
    };
}());
//# sourceMappingURL=phosphorus.dist.js.map