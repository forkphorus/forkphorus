"use strict";
/*!
This file is generated from source files in https://github.com/forkphorus/forkphorus
Please see the README for more information.

License for forkphorus:
The MIT License (MIT)

Copyright (c) 2013-2017 Nathan Dinsmore
Copyright (c) 2019-2021 Thomas Weber

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

Parts of forkphorus are based on Sulfurous (https://sulfurous.aau.at/) and Scratch (https://scratch.mit.edu/)

License for Sulfurous:
The MIT License (MIT)
Copyright (c) 2013-2014 Nathan Dinsmore
Copyright (c) 2016 Mittagskogel
Copyright (c) 2017-2020 FRALEX

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

License for Scratch:
Copyright (c) 2016, Massachusetts Institute of Technology
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
if (!('Promise' in window)) {
    throw new Error('Browser does not support Promise');
}
var P;
(function (P) {
    var config;
    (function (config) {
        config.debug = false;
        config.useWebGL = false;
        config.supportVideoSensing = false;
        config.experimentalOptimizations = false;
        config.scale = window.devicePixelRatio || 1;
        config.PROJECT_API = 'https://projects.scratch.mit.edu/$id';
    })(config = P.config || (P.config = {}));
})(P || (P = {}));
var P;
(function (P) {
    var audio;
    (function (audio) {
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
            var volume = 0.5;
            var globalNode = audio.context.createGain();
            globalNode.gain.value = volume;
            globalNode.connect(audio.context.destination);
        }
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
        const SB2_SOUNDBANK_FILES = {
            'AcousticGuitar_F3': 'sb2/instruments/AcousticGuitar_F3_22k.wav',
            'AcousticPiano_As3': 'sb2/instruments/AcousticPiano(5)_A%233_22k.wav',
            'AcousticPiano_C4': 'sb2/instruments/AcousticPiano(5)_C4_22k.wav',
            'AcousticPiano_G4': 'sb2/instruments/AcousticPiano(5)_G4_22k.wav',
            'AcousticPiano_F5': 'sb2/instruments/AcousticPiano(5)_F5_22k.wav',
            'AcousticPiano_C6': 'sb2/instruments/AcousticPiano(5)_C6_22k.wav',
            'AcousticPiano_Ds6': 'sb2/instruments/AcousticPiano(5)_D%236_22k.wav',
            'AcousticPiano_D7': 'sb2/instruments/AcousticPiano(5)_D7_22k.wav',
            'AltoSax_A3': 'sb2/instruments/AltoSax_A3_22K.wav',
            'AltoSax_C6': 'sb2/instruments/AltoSax(3)_C6_22k.wav',
            'Bassoon_C3': 'sb2/instruments/Bassoon_C3_22k.wav',
            'BassTrombone_A2_2': 'sb2/instruments/BassTrombone_A2(2)_22k.wav',
            'BassTrombone_A2_3': 'sb2/instruments/BassTrombone_A2(3)_22k.wav',
            'Cello_C2': 'sb2/instruments/Cello(3b)_C2_22k.wav',
            'Cello_As2': 'sb2/instruments/Cello(3)_A%232_22k.wav',
            'Choir_F3': 'sb2/instruments/Choir(4)_F3_22k.wav',
            'Choir_F4': 'sb2/instruments/Choir(4)_F4_22k.wav',
            'Choir_F5': 'sb2/instruments/Choir(4)_F5_22k.wav',
            'Clarinet_C4': 'sb2/instruments/Clarinet_C4_22k.wav',
            'ElectricBass_G1': 'sb2/instruments/ElectricBass(2)_G1_22k.wav',
            'ElectricGuitar_F3': 'sb2/instruments/ElectricGuitar(2)_F3(1)_22k.wav',
            'ElectricPiano_C2': 'sb2/instruments/ElectricPiano_C2_22k.wav',
            'ElectricPiano_C4': 'sb2/instruments/ElectricPiano_C4_22k.wav',
            'EnglishHorn_D4': 'sb2/instruments/EnglishHorn(1)_D4_22k.wav',
            'EnglishHorn_F3': 'sb2/instruments/EnglishHorn(1)_F3_22k.wav',
            'Flute_B5_1': 'sb2/instruments/Flute(3)_B5(1)_22k.wav',
            'Flute_B5_2': 'sb2/instruments/Flute(3)_B5(2)_22k.wav',
            'Marimba_C4': 'sb2/instruments/Marimba_C4_22k.wav',
            'MusicBox_C4': 'sb2/instruments/MusicBox_C4_22k.wav',
            'Organ_G2': 'sb2/instruments/Organ(2)_G2_22k.wav',
            'Pizz_A3': 'sb2/instruments/Pizz(2)_A3_22k.wav',
            'Pizz_E4': 'sb2/instruments/Pizz(2)_E4_22k.wav',
            'Pizz_G2': 'sb2/instruments/Pizz(2)_G2_22k.wav',
            'SteelDrum_D5': 'sb2/instruments/SteelDrum_D5_22k.wav',
            'SynthLead_C4': 'sb2/instruments/SynthLead(6)_C4_22k.wav',
            'SynthLead_C6': 'sb2/instruments/SynthLead(6)_C6_22k.wav',
            'SynthPad_A3': 'sb2/instruments/SynthPad(2)_A3_22k.wav',
            'SynthPad_C6': 'sb2/instruments/SynthPad(2)_C6_22k.wav',
            'TenorSax_C3': 'sb2/instruments/TenorSax(1)_C3_22k.wav',
            'Trombone_B3': 'sb2/instruments/Trombone_B3_22k.wav',
            'Trumpet_E5': 'sb2/instruments/Trumpet_E5_22k.wav',
            'Vibraphone_C3': 'sb2/instruments/Vibraphone_C3_22k.wav',
            'Violin_D4': 'sb2/instruments/Violin(2)_D4_22K.wav',
            'Violin_A4': 'sb2/instruments/Violin(3)_A4_22k.wav',
            'Violin_E5': 'sb2/instruments/Violin(3b)_E5_22k.wav',
            'WoodenFlute_C5': 'sb2/instruments/WoodenFlute_C5_22k.wav',
            'BassDrum': 'sb2/drums/BassDrum(1b)_22k.wav',
            'Bongo': 'sb2/drums/Bongo_22k.wav',
            'Cabasa': 'sb2/drums/Cabasa(1)_22k.wav',
            'Clap': 'sb2/drums/Clap(1)_22k.wav',
            'Claves': 'sb2/drums/Claves(1)_22k.wav',
            'Conga': 'sb2/drums/Conga(1)_22k.wav',
            'Cowbell': 'sb2/drums/Cowbell(3)_22k.wav',
            'Crash': 'sb2/drums/Crash(2)_22k.wav',
            'Cuica': 'sb2/drums/Cuica(2)_22k.wav',
            'GuiroLong': 'sb2/drums/GuiroLong(1)_22k.wav',
            'GuiroShort': 'sb2/drums/GuiroShort(1)_22k.wav',
            'HiHatClosed': 'sb2/drums/HiHatClosed(1)_22k.wav',
            'HiHatOpen': 'sb2/drums/HiHatOpen(2)_22k.wav',
            'HiHatPedal': 'sb2/drums/HiHatPedal(1)_22k.wav',
            'Maracas': 'sb2/drums/Maracas(1)_22k.wav',
            'SideStick': 'sb2/drums/SideStick(1)_22k.wav',
            'SnareDrum': 'sb2/drums/SnareDrum(1)_22k.wav',
            'Tambourine': 'sb2/drums/Tambourine(3)_22k.wav',
            'Tom': 'sb2/drums/Tom(1)_22k.wav',
            'Triangle': 'sb2/drums/Triangle(1)_22k.wav',
            'Vibraslap': 'sb2/drums/Vibraslap(1)_22k.wav',
            'WoodBlock': 'sb2/drums/WoodBlock(1)_22k.wav'
        };
        const soundbank = {};
        function loadSoundbankSB2(loader) {
            if (!audio.context)
                return Promise.resolve();
            const promises = [];
            for (const name in SB2_SOUNDBANK_FILES) {
                if (!soundbank[name]) {
                    const promise = P.utils.settled(loadSoundbankBuffer(name));
                    promises.push(promise);
                    if (loader) {
                        loader.addTask(new P.io.PromiseTask(promise));
                    }
                }
            }
            return Promise.all(promises);
        }
        audio.loadSoundbankSB2 = loadSoundbankSB2;
        function loadSoundbankBuffer(name) {
            return P.io.getAssetManager().loadSoundbankFile(SB2_SOUNDBANK_FILES[name])
                .then((buffer) => P.audio.decodeAudio(buffer))
                .then((sound) => soundbank[name] = sound);
        }
        function playSpan(span, key, duration, connection) {
            if (!audio.context) {
                throw new Error('Cannot playSpan without an AudioContext');
            }
            const buffer = soundbank[span.name];
            if (!buffer) {
                throw new Error('No soundbank entry named: ' + span.name);
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
            return source;
        }
        audio.playSpan = playSpan;
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
                return Promise.reject(new Error('No audio context'));
            }
            return new Promise((resolve, reject) => {
                decodeADPCMAudio(ab, function (err1, buffer) {
                    if (buffer) {
                        resolve(buffer);
                        return;
                    }
                    audio.context.decodeAudioData(ab, function (buffer) {
                        resolve(buffer);
                    }, function (err2) {
                        reject(`Could not decode audio: ${err1} | ${err2}`);
                    });
                });
            });
        }
        audio.decodeAudio = decodeAudio;
    })(audio = P.audio || (P.audio = {}));
})(P || (P = {}));
var P;
(function (P) {
    var core;
    (function (core) {
        ;
        class PenColor {
            constructor() {
                this.x = 0;
                this.y = 0;
                this.z = 255;
                this.a = 1;
                this.mode = 0;
                this.css = 'rgba(0, 0, 255, 1)';
            }
            setRGBA(rgba) {
                this.x = rgba >> 16 & 0xff;
                this.y = rgba >> 8 & 0xff;
                this.z = rgba & 0xff;
                this.a = (rgba >> 24 & 0xff) / 0xff || 1;
                this.css = 'rgba(' + this.x + ', ' + this.y + ', ' + this.z + ', ' + this.a + ')';
                this.mode = 0;
            }
            setShiftedRGBA(rgba) {
                this.setRGBA(rgba);
                this.toHSVA();
            }
            toHSLA() {
                switch (this.mode) {
                    case 0: {
                        this.mode = 1;
                        const hsl = P.utils.rgbToHSL(this.x, this.y, this.z);
                        this.x = hsl[0];
                        this.y = hsl[1] * 100;
                        this.z = hsl[2] * 100;
                        break;
                    }
                    case 2: {
                        this.mode = 1;
                        const hsl = P.utils.hsvToHSL(this.x, this.y / 100, this.z / 100);
                        this.x = hsl[0];
                        this.y = hsl[1] * 100;
                        this.z = hsl[2] * 100;
                        break;
                    }
                }
            }
            toHSVA() {
                switch (this.mode) {
                    case 0: {
                        this.mode = 2;
                        const hsv = P.utils.rgbToHSV(this.x, this.y, this.z);
                        this.x = hsv[0];
                        this.y = hsv[1] * 100;
                        this.z = hsv[2] * 100;
                        break;
                    }
                    case 1: {
                        this.mode = 2;
                        const hsv = P.utils.hslToHSV(this.x, this.y / 100, this.z / 100);
                        this.x = hsv[0];
                        this.y = hsv[1] * 100;
                        this.z = hsv[2] * 100;
                        break;
                    }
                }
            }
            toParts() {
                switch (this.mode) {
                    case 0: {
                        return [this.x, this.y, this.z, this.a];
                    }
                    case 2: {
                        const rgb = P.utils.hsvToRGB(this.x / 360, this.y / 100, this.z / 100);
                        return [rgb[0], rgb[1], rgb[2], this.a];
                    }
                    case 1: {
                        const rgb = P.utils.hslToRGB(this.x / 360, this.y / 100, this.z / 100);
                        return [rgb[0], rgb[1], rgb[2], this.a];
                    }
                }
            }
            toCSS() {
                switch (this.mode) {
                    case 0:
                        return this.css;
                    case 1:
                        return 'hsla(' + this.x + ',' + this.y + '%,' + (this.z > 100 ? 200 - this.z : this.z) + '%,' + this.a + ')';
                    case 2: {
                        const rgb = P.utils.hsvToRGB(this.x / 360, this.y / 100, this.z / 100);
                        return 'rgba(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ', ' + this.a + ')';
                    }
                }
            }
            setParam(param, value) {
                this.toHSVA();
                switch (param) {
                    case 'color':
                        this.x = (value * 360 / 100) % 360;
                        if (this.x < 0)
                            this.x += 360;
                        break;
                    case 'saturation':
                        this.y = P.utils.clamp(value, 0, 100);
                        break;
                    case 'brightness':
                        this.z = P.utils.clamp(value, 0, 100);
                        break;
                    case 'transparency':
                        this.a = 1 - (value / 100);
                        if (this.a > 1)
                            this.a = 1;
                        if (this.a < 0)
                            this.a = 0;
                        break;
                }
            }
            changeParam(param, value) {
                this.toHSVA();
                switch (param) {
                    case 'color':
                        this.x = (this.x + value * 360 / 100) % 360;
                        if (this.x < 0)
                            this.x += 360;
                        break;
                    case 'saturation':
                        this.y = P.utils.clamp(this.y + value, 0, 100);
                        break;
                    case 'brightness':
                        this.z = P.utils.clamp(this.z + value, 0, 100);
                        break;
                    case 'transparency':
                        this.a = Math.max(0, Math.min(1, this.a - value / 100));
                        break;
                }
            }
            copy(other) {
                this.x = other.x;
                this.y = other.y;
                this.z = other.z;
                this.a = other.a;
                this.css = other.css;
                this.mode = other.mode;
            }
        }
        core.PenColor = PenColor;
        class Base {
            constructor() {
                this.isStage = false;
                this.isSprite = false;
                this.isClone = false;
                this.visible = true;
                this.scratchX = 0;
                this.scratchY = 0;
                this.name = '';
                this.costumes = [];
                this.currentCostumeIndex = 0;
                this.sounds = [];
                this.soundRefs = {};
                this.instrument = 0;
                this.volume = 1;
                this.node = null;
                this.activeSounds = new Set();
                this.watchers = {};
                this.listWatchers = {};
                this.vars = {};
                this.lists = {};
                this.saying = false;
                this.thinking = false;
                this.sayId = 0;
                this.procedures = {};
                this.listeners = {
                    whenClicked: [],
                    whenCloned: [],
                    whenGreenFlag: [],
                    whenIReceive: {},
                    whenKeyPressed: {},
                    whenSceneStarts: {},
                    edgeActivated: [],
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
                this.soundFilters = {
                    pitch: 0,
                };
                this.penSize = 1;
                this.penColor = new PenColor();
                this.isPenDown = false;
            }
            addSound(sound) {
                this.soundRefs[sound.name] = sound;
                this.sounds.push(sound);
            }
            showVariable(name, visible) {
                let watcher = this.watchers[name];
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
            showList(name, visible) {
                let watcher = this.listWatchers[name];
                if (!watcher) {
                    const newWatcher = this.createListWatcher(this, name);
                    if (!newWatcher) {
                        return;
                    }
                    newWatcher.init();
                    this.listWatchers[name] = watcher = newWatcher;
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
                    if (!isFinite(costume) || !/\d/.test(costume)) {
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
                        if (value === Infinity) {
                            break;
                        }
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
                this.soundFilters = {
                    pitch: 0
                };
            }
            setSoundFilter(name, value) {
                value = value || 0;
                switch (name.toLowerCase()) {
                    case 'pitch':
                        this.soundFilters.pitch = value;
                        if (!this.stage.removeLimits) {
                            if (this.soundFilters.pitch > 360)
                                this.soundFilters.pitch = 360;
                            if (this.soundFilters.pitch < -360)
                                this.soundFilters.pitch = -360;
                        }
                        break;
                }
            }
            changeSoundFilter(name, value) {
                switch (name.toLowerCase()) {
                    case 'pitch':
                        this.soundFilters.pitch += value;
                        if (!this.stage.removeLimits) {
                            if (this.soundFilters.pitch > 360)
                                this.soundFilters.pitch = 360;
                            if (this.soundFilters.pitch < -360)
                                this.soundFilters.pitch = -360;
                        }
                        break;
                }
            }
            resetSoundFilters() {
                this.soundFilters = {
                    pitch: 0,
                };
            }
            getSound(name) {
                if (typeof name === 'string') {
                    var s = this.soundRefs[name];
                    if (s)
                        return s;
                    name = parseInt(name, 10);
                }
                var l = this.sounds.length;
                if (l && typeof name === 'number' && name === name) {
                    var i = Math.round(name - 1) % l;
                    if (i < 0)
                        i += l;
                    return this.sounds[i];
                }
            }
            stopSounds() {
                if (this.node) {
                    for (const sound of this.activeSounds) {
                        sound.stopped = true;
                        if (sound.node) {
                            sound.node.disconnect();
                        }
                    }
                    this.activeSounds.clear();
                    this.node.disconnect();
                    this.node = null;
                }
            }
            stopSoundsExcept(originBase) {
                if (this.node) {
                    for (const sound of this.activeSounds) {
                        if (sound.base !== originBase) {
                            if (sound.node) {
                                sound.node.disconnect();
                            }
                            sound.stopped = true;
                            this.activeSounds.delete(sound);
                        }
                    }
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
            say(text, thinking = false) {
                text = '' + text;
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
                    this.bubblePointer.style.background = `url("${P.io.config.localPath}icons.svg")`;
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
            updateBubble() {
                if (!this.visible || !this.saying) {
                    this.bubbleContainer.style.display = 'none';
                    return;
                }
                this.bubbleContainer.style.display = 'block';
                const b = this.rotatedBounds();
                const left = 240 + b.right;
                var bottom = 180 + b.top;
                const width = this.bubbleContainer.offsetWidth / this.stage.zoom;
                const height = this.bubbleContainer.offsetHeight / this.stage.zoom;
                this.bubblePointer.style.top = ((height - 6) / 14) + 'em';
                if (left + width + 2 > 480) {
                    var d = (240 - b.left) / 14;
                    if (d > 25)
                        d = 25;
                    this.bubbleContainer.style.right = d + 'em';
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
            remove() {
                if (this.bubbleContainer) {
                    this.stage.ui.removeChild(this.bubbleContainer);
                }
                if (this.node && this.isClone && !this.isStage) {
                    for (const sound of this.activeSounds) {
                        if (sound.node) {
                            sound.node.disconnect();
                        }
                        sound.stopped = true;
                    }
                    this.activeSounds.clear();
                    this.node.disconnect();
                    this.node.connect(this.stage.getAudioNode());
                    this.node = null;
                }
            }
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
            createVariableWatcher(target, variableName) {
                return null;
            }
            createListWatcher(target, listName) {
                return null;
            }
            dotPen() {
                this.stage.renderer.penDot(this.penColor, this.penSize, this.scratchX, this.scratchY);
            }
            stamp() {
                this.stage.renderer.penStamp(this);
            }
            addWhenKeyPressedHandler(key, fn) {
                if (this.listeners.whenKeyPressed[key]) {
                    this.listeners.whenKeyPressed[key].push(fn);
                }
                else {
                    this.listeners.whenKeyPressed[key] = [fn];
                }
            }
        }
        core.Base = Base;
        class Stage extends Base {
            constructor() {
                super();
                this.stage = this;
                this.isStage = true;
                this.children = [];
                this.allWatchers = [];
                this.answer = '';
                this.promptId = 0;
                this.nextPromptId = 0;
                this.hidePrompt = false;
                this.zoom = 1;
                this.rawMouseX = 0;
                this.rawMouseY = 0;
                this.mouseX = 0;
                this.mouseY = 0;
                this.mousePressed = false;
                this.tempoBPM = 60;
                this.username = '';
                this.counter = 0;
                this.cloudHandler = null;
                this.cloudVariables = [];
                this.microphone = null;
                this.tts = null;
                this.extensions = [];
                this.useSpriteFencing = false;
                this.removeLimits = false;
                this.runtime = new P.runtime.Runtime(this);
                this.keys = [];
                this.keys.any = 0;
                this.root = document.createElement('div');
                this.root.classList.add('forkphorus-root');
                if (P.config.useWebGL) {
                    this.renderer = new P.renderer.webgl.WebGLProjectRenderer(this);
                }
                else {
                    this.renderer = new P.renderer.canvas2d.ProjectRenderer2D(this);
                }
                this.renderer.resize(1);
                this.renderer.init(this.root);
                this.canvas = this.renderer.canvas;
                this.ui = document.createElement('div');
                this.root.appendChild(this.ui);
                this.ui.style.pointerEvents = 'none';
                this.canvas.tabIndex = 0;
                this.canvas.style.outline = 'none';
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
                this.promptButton.style.background = `url("${P.io.config.localPath}icons.svg") -22.8em -0.4em`;
                this.promptButton.style.backgroundSize = '38.4em 6.4em';
                this.addEventListeners();
            }
            addEventListeners() {
                this._onmousedown = this._onmousedown.bind(this);
                this._onmouseup = this._onmouseup.bind(this);
                this._onmousemove = this._onmousemove.bind(this);
                this._ontouchstart = this._ontouchstart.bind(this);
                this._ontouchend = this._ontouchend.bind(this);
                this._ontouchmove = this._ontouchmove.bind(this);
                document.addEventListener('mousedown', this._onmousedown);
                document.addEventListener('mouseup', this._onmouseup);
                document.addEventListener('mousemove', this._onmousemove);
                document.addEventListener('touchstart', this._ontouchstart, { passive: false });
                document.addEventListener('touchend', this._ontouchend);
                document.addEventListener('touchmove', this._ontouchmove);
                this.root.addEventListener('wheel', this._onwheel.bind(this));
                this.root.addEventListener('keyup', this._onkeyup.bind(this));
                this.root.addEventListener('keydown', this._onkeydown.bind(this));
                this.promptButton.addEventListener('touchstart', this.submitPrompt.bind(this));
                this.promptButton.addEventListener('mousedown', this.submitPrompt.bind(this));
                this.prompt.addEventListener('keydown', (e) => {
                    if (e.keyCode === 13)
                        this.submitPrompt();
                });
            }
            removeEventListeners() {
                document.removeEventListener('mousedown', this._onmousedown);
                document.removeEventListener('mouseup', this._onmouseup);
                document.removeEventListener('mousemove', this._onmousemove);
                document.removeEventListener('touchstart', this._ontouchstart);
                document.removeEventListener('touchend', this._ontouchend);
                document.removeEventListener('touchmove', this._ontouchmove);
            }
            _onwheel(e) {
                if (e.deltaY > 0) {
                    this.runtime.trigger('whenKeyPressed', "down arrow");
                }
                else if (e.deltaY < 0) {
                    this.runtime.trigger('whenKeyPressed', "up arrow");
                }
            }
            keyEventToCode(e) {
                const key = e.key || '';
                switch (key) {
                    case 'Enter': return "enter";
                    case 'ArrowLeft':
                    case 'Left': return "left arrow";
                    case 'ArrowUp':
                    case 'Up': return "up arrow";
                    case 'ArrowRight':
                    case 'Right': return "right arrow";
                    case 'ArrowDown':
                    case 'Down': return "down arrow";
                }
                if (key.length !== 1) {
                    return null;
                }
                return '' + key.toUpperCase().charCodeAt(0);
            }
            _onkeyup(e) {
                const c = this.keyEventToCode(e);
                if (c === null)
                    return;
                if (this.keys[c])
                    this.keys.any--;
                this.keys[c] = false;
                e.stopPropagation();
                if (e.target === this.canvas) {
                    e.preventDefault();
                }
            }
            _onkeydown(e) {
                const c = this.keyEventToCode(e);
                if (c === null)
                    return;
                if (!this.keys[c])
                    this.keys.any++;
                this.keys[c] = true;
                if (e.ctrlKey || e.altKey || e.metaKey || c === '27')
                    return;
                e.stopPropagation();
                if (e.target === this.canvas) {
                    e.preventDefault();
                    this.runtime.trigger('whenKeyPressed', c);
                }
            }
            _onmousedown(e) {
                if (!this.runtime.isRunning)
                    return;
                this.updateMousePosition(e);
                this.mousePressed = true;
                if (e.target === this.canvas) {
                    this.clickMouse();
                    e.preventDefault();
                    this.canvas.focus();
                }
                this.onmousedown(e);
            }
            _onmouseup(e) {
                if (!this.runtime.isRunning)
                    return;
                this.updateMousePosition(e);
                this.releaseMouse();
                this.onmouseup(e);
            }
            _onmousemove(e) {
                if (!this.runtime.isRunning)
                    return;
                this.updateMousePosition(e);
                this.onmousemove(e);
            }
            _ontouchend(e) {
                if (!this.runtime.isRunning)
                    return;
                this.releaseMouse();
                for (var i = 0; i < e.changedTouches.length; i++) {
                    const t = e.changedTouches[i];
                    this.ontouch(e, t);
                }
            }
            _ontouchstart(e) {
                if (!this.runtime.isRunning)
                    return;
                this.mousePressed = true;
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
            }
            _ontouchmove(e) {
                if (!this.runtime.isRunning)
                    return;
                this.updateMousePosition(e.changedTouches[0]);
                for (var i = 0; i < e.changedTouches.length; i++) {
                    const t = e.changedTouches[i];
                    this.ontouch(e, t);
                }
            }
            ontouch(e, t) { }
            onmousedown(e) { }
            onmouseup(e) { }
            onmousemove(e) { }
            destroy() {
                this.runtime.stopAll();
                this.runtime.pause();
                this.stopAllSounds();
                for (const extension of this.extensions) {
                    extension.destroy();
                }
                this.renderer.destroy();
                this.removeEventListeners();
            }
            pauseExtensions() {
                for (const extension of this.extensions) {
                    extension.onpause();
                }
            }
            startExtensions() {
                for (const extension of this.extensions) {
                    extension.onstart();
                }
            }
            updateExtensions() {
                if (this.extensions.length) {
                    for (const extension of this.extensions) {
                        extension.update();
                    }
                }
            }
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
                this.mouseX = Math.round(x);
                this.mouseY = Math.round(y);
            }
            setZoom(zoom) {
                if (this.zoom === zoom)
                    return;
                this.renderer.resize(zoom);
                this.root.style.width = (480 * zoom | 0) + 'px';
                this.root.style.height = (360 * zoom | 0) + 'px';
                this.root.style.fontSize = (zoom * 10) + 'px';
                this.zoom = zoom;
                for (const watcher of this.allWatchers) {
                    if (watcher instanceof P.sb3.Scratch3ListWatcher) {
                        watcher.updateList();
                    }
                }
            }
            clickMouse() {
                this.mouseSprite = undefined;
                for (var i = this.children.length; i--;) {
                    var c = this.children[i];
                    if (c.visible && c.filters.ghost < 100 && c.touching("_mouse_")) {
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
                super.setFilter(name, value);
                this.renderer.onStageFiltersChanged();
            }
            resetFilters() {
                super.resetFilters();
                this.renderer.onStageFiltersChanged();
            }
            getObject(name) {
                for (var i = 0; i < this.children.length; i++) {
                    var c = this.children[i];
                    if (c.name === name && !c.isClone) {
                        return c;
                    }
                }
                if (name === "_stage_" || name === this.name) {
                    return this;
                }
                return null;
            }
            getObjects(name) {
                const result = [];
                for (var i = 0; i < this.children.length; i++) {
                    if (this.children[i].name === name) {
                        result.push(this.children[i]);
                    }
                }
                return result;
            }
            getPosition(name) {
                switch (name) {
                    case "_mouse_": return {
                        x: this.mouseX,
                        y: this.mouseY,
                    };
                    case "_random_": return {
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
            draw() {
                this.renderer.drawFrame();
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
            showVideo(visible) {
                if (P.config.supportVideoSensing) {
                    if (visible) {
                        if (!this.videoElement) {
                            this.videoElement = document.createElement('video');
                            this.videoElement.onloadedmetadata = () => {
                                this.videoElement.play();
                            };
                            this.videoElement.style.opacity = '0.5';
                            this.root.insertBefore(this.videoElement, this.canvas);
                            navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                                .then((stream) => this.videoElement.srcObject = stream);
                        }
                        this.videoElement.style.display = 'block';
                    }
                    else {
                        if (this.videoElement) {
                            this.videoElement.style.display = 'none';
                        }
                    }
                }
            }
            addExtension(extension) {
                this.extensions.push(extension);
            }
            initMicrophone() {
                if (!this.microphone) {
                    this.microphone = new P.ext.microphone.MicrophoneExtension(this);
                    this.addExtension(this.microphone);
                }
            }
            initTextToSpeech() {
                if (!this.tts) {
                    this.tts = new P.ext.tts.TextToSpeechExtension(this);
                    this.addExtension(this.tts);
                }
            }
            setCloudHandler(cloudHandler) {
                this.cloudHandler = cloudHandler;
                this.addExtension(cloudHandler);
            }
            stopAllSounds() {
                for (var children = this.children, i = children.length; i--;) {
                    children[i].stopSounds();
                }
                this.stopSounds();
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
            }
            gotoObject() {
            }
            forward() {
            }
            setDirection(direction) {
            }
            rotatedBounds() {
                return {
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                };
            }
            touching(thing) {
                if (thing == "_mouse_") {
                    return true;
                }
                return false;
            }
            touchingColor(color) {
                return false;
            }
            colorTouchingColor(colorA, colorB) {
                return false;
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
        class Sprite extends Base {
            constructor(stage) {
                super();
                this.isSprite = true;
                this.isClone = false;
                this.direction = 90;
                this.rotationStyle = 0;
                this.isDraggable = false;
                this.isDragging = false;
                this.scale = 1;
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
                if (this.isDragging && this.scratchX === this.dragStartX && this.scratchY === this.dragStartY) {
                    this.stage.runtime.triggerFor(this, 'whenClicked');
                }
                this.isDragging = false;
            }
            rotatedBounds() {
                const costume = this.costumes[this.currentCostumeIndex];
                const scale = costume.scale * this.scale;
                var left = -costume.rotationCenterX * scale;
                var top = costume.rotationCenterY * scale;
                var right = left + costume.width * scale;
                var bottom = top - costume.height * scale;
                if (this.rotationStyle !== 0) {
                    if (this.rotationStyle === 1 && this.direction < 0) {
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
                const tlX = mSin * left - mCos * top;
                const tlY = mCos * left + mSin * top;
                const trX = mSin * right - mCos * top;
                const trY = mCos * right + mSin * top;
                const blX = mSin * left - mCos * bottom;
                const blY = mCos * left + mSin * bottom;
                const brX = mSin * right - mCos * bottom;
                const brY = mCos * right + mSin * bottom;
                return {
                    left: this.scratchX + Math.min(tlX, trX, blX, brX),
                    right: this.scratchX + Math.max(tlX, trX, blX, brX),
                    top: this.scratchY + Math.max(tlY, trY, blY, brY),
                    bottom: this.scratchY + Math.min(tlY, trY, blY, brY)
                };
            }
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
            createVariableWatcher(target, variableName) {
                return this.stage.createVariableWatcher(target, variableName);
            }
            forward(steps) {
                const d = (90 - this.direction) * Math.PI / 180;
                this.moveTo(this.scratchX + steps * Math.cos(d), this.scratchY + steps * Math.sin(d));
            }
            keepInView() {
                const rb = this.rotatedBounds();
                const width = rb.right - rb.left;
                const height = rb.top - rb.bottom;
                const bounds = Math.min(15, Math.floor(Math.min(width, height) / 2));
                if (rb.right - bounds < -240) {
                    this.scratchX -= rb.right - bounds + 240;
                }
                if (rb.left + bounds > 240) {
                    this.scratchX -= rb.left + bounds - 240;
                }
                if (rb.bottom + bounds > 180) {
                    this.scratchY -= rb.bottom + bounds - 180;
                }
                if (rb.top - bounds < -180) {
                    this.scratchY -= rb.top - bounds + 180;
                }
            }
            moveTo(x, y) {
                var ox = this.scratchX;
                var oy = this.scratchY;
                if (ox === x && oy === y && !this.isPenDown) {
                    return;
                }
                this.scratchX = x;
                this.scratchY = y;
                if (this.stage.useSpriteFencing) {
                    this.keepInView();
                }
                if (this.isPenDown && !this.isDragging) {
                    this.stage.renderer.penLine(this.penColor, this.penSize, ox, oy, x, y);
                }
                if (this.saying) {
                    this.updateBubble();
                }
            }
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
            clone() {
                const clone = this._clone();
                clone.isClone = true;
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
                clone.procedures = this.procedures;
                clone.listeners = this.listeners;
                clone.fns = this.fns;
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
                clone.penSize = this.penSize;
                clone.penColor.copy(this.penColor);
                clone.isPenDown = this.isPenDown;
                clone.watchers = this.watchers;
                clone.listWatchers = this.listWatchers;
                return clone;
            }
            touching(thing) {
                if (thing === "_mouse_") {
                    const x = this.stage.rawMouseX;
                    const y = this.stage.rawMouseY;
                    return this.stage.renderer.spriteTouchesPoint(this, x, y);
                }
                else if (thing === "_edge_") {
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
            touchingColor(color) {
                return this.stage.renderer.spriteTouchesColor(this, color);
            }
            colorTouchingColor(sourceColor, touchingColor) {
                return this.stage.renderer.spriteColorTouchesColor(this, sourceColor, touchingColor);
            }
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
            }
            distanceTo(thing) {
                const p = this.stage.getPosition(thing);
                if (!p) {
                    return 10000;
                }
                const x = p.x;
                const y = p.y;
                return Math.sqrt((this.scratchX - x) * (this.scratchX - x) + (this.scratchY - y) * (this.scratchY - y));
            }
            gotoObject(thing) {
                const position = this.stage.getPosition(thing);
                if (!position) {
                    return 0;
                }
                this.moveTo(position.x, position.y);
            }
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
        }
        core.Sprite = Sprite;
        class Costume {
            constructor(costumeData) {
                this.name = costumeData.name;
                this.scale = 1 / costumeData.bitmapResolution;
                this.rotationCenterX = costumeData.rotationCenterX;
                this.rotationCenterY = costumeData.rotationCenterY;
            }
        }
        core.Costume = Costume;
        class BitmapCostume extends Costume {
            constructor(image, options) {
                super(options);
                if (image.tagName === 'CANVAS') {
                    const ctx = image.getContext('2d');
                    if (!ctx) {
                        throw new Error(`Cannot get 2d rendering context of costume image, despite it already being a canvas "${this.name}"`);
                    }
                    this.ctx = ctx;
                }
                this.image = image;
                this.width = image.width;
                this.height = image.height;
                this.isScalable = false;
            }
            getContext() {
                if (this.ctx) {
                    return this.ctx;
                }
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    throw new Error(`cannot get 2d rendering context in getContext on Bitmap "${this.name}"`);
                }
                canvas.width = this.width;
                canvas.height = this.height;
                ctx.drawImage(this.image, 0, 0);
                this.ctx = ctx;
                return ctx;
            }
            getImage() {
                return this.image;
            }
            requestSize(scale) {
                throw new Error(`requestSize is not implemented on BitmapCostume "${this.name}" isScalable=${this.isScalable}`);
            }
        }
        core.BitmapCostume = BitmapCostume;
        class VectorCostume extends Costume {
            constructor(svg, options) {
                super(options);
                if (svg.height < 1 || svg.width < 1) {
                    svg = new Image(1, 1);
                }
                this.isScalable = true;
                this.width = svg.width;
                this.height = svg.height;
                this.svg = svg;
                this.maxScale = this.calculateMaxScale();
                this.currentScale = Math.min(1, this.maxScale);
            }
            calculateMaxScale() {
                if (VectorCostume.MAX_SIZE / this.width < VectorCostume.MAX_SCALE) {
                    return VectorCostume.MAX_SIZE / this.width;
                }
                if (VectorCostume.MAX_SIZE / this.height < VectorCostume.MAX_SCALE) {
                    return VectorCostume.MAX_SIZE / this.height;
                }
                return VectorCostume.MAX_SCALE;
            }
            render() {
                const width = Math.floor(Math.max(1, this.width * this.currentScale));
                const height = Math.floor(Math.max(1, this.height * this.currentScale));
                if (!this.canvas) {
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        const fmt = (n) => Math.round(n * 100) / 100;
                        throw new Error(`cannot get 2d rendering context in initCanvas on Vector "${this.name}" @ ${fmt(this.currentScale)}/${fmt(this.maxScale)} | ${width}x${height}`);
                    }
                    this.canvas = canvas;
                    this.ctx = ctx;
                }
                else {
                    this.canvas.width = width;
                    this.canvas.height = height;
                }
                this.ctx.drawImage(this.svg, 0, 0, width, height);
            }
            requestSize(costumeScale) {
                if (VectorCostume.DISABLE_RASTERIZE) {
                    return;
                }
                const scale = Math.min(Math.ceil(costumeScale), this.maxScale);
                if (this.currentScale < scale) {
                    this.currentScale = scale;
                    this.render();
                }
            }
            getContext() {
                if (this.ctx) {
                    return this.ctx;
                }
                this.render();
                return this.ctx;
            }
            getImage() {
                if (VectorCostume.DISABLE_RASTERIZE) {
                    return this.svg;
                }
                if (this.canvas) {
                    return this.canvas;
                }
                this.render();
                return this.canvas;
            }
        }
        VectorCostume.MAX_SCALE = 16;
        VectorCostume.MAX_SIZE = 2048;
        VectorCostume.DISABLE_RASTERIZE = false;
        core.VectorCostume = VectorCostume;
        if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
            console.log('Vector rasterization is disabled. This may affect performance.');
            VectorCostume.DISABLE_RASTERIZE = true;
        }
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
                const source = P.audio.context.createBufferSource();
                this.source = source;
                this.source.buffer = this.buffer;
                this.source.addEventListener('ended', () => {
                    source.ended = true;
                });
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
                this.stage = stage;
                this.targetName = targetName;
            }
            init() {
                this.target = this.stage.getObject(this.targetName) || this.stage;
            }
            setVisible(visible) {
                this.visible = visible;
            }
        }
        core.Watcher = Watcher;
        class Procedure {
            constructor(fn, warp, inputs) {
                this.fn = fn;
                this.warp = warp;
                this.inputs = inputs;
            }
        }
        core.Procedure = Procedure;
        function isSprite(base) {
            return base.isSprite;
        }
        core.isSprite = isSprite;
    })(core = P.core || (P.core = {}));
})(P || (P = {}));
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
        };
        function loadLocalFont(fontFamily, src) {
            if (fontFamilyCache[fontFamily]) {
                return Promise.resolve(fontFamilyCache[fontFamily]);
            }
            return P.io.getAssetManager().loadFont(src)
                .then((blob) => P.io.readers.toDataURL(blob))
                .then((url) => {
                fontFamilyCache[fontFamily] = url;
                return url;
            });
        }
        fonts_1.loadLocalFont = loadLocalFont;
        function getFont(fontFamily) {
            if (!(fontFamily in fontFamilyCache)) {
                return null;
            }
            return fontFamilyCache[fontFamily];
        }
        function getCSSFontFace(fontFamily, src) {
            return `@font-face { font-family: "${fontFamily}"; src: url("${src}"); }`;
        }
        function addFontRules(svg, fonts) {
            const cssRules = [];
            for (const fontName of fonts) {
                const font = getFont(fontName);
                if (!font) {
                    console.warn('unknown font from cache', fontName);
                    continue;
                }
                cssRules.push(getCSSFontFace(fontName, font));
            }
            const doc = svg.ownerDocument;
            const defs = doc.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const style = doc.createElementNS('http://www.w3.org/2000/svg', 'style');
            style.innerHTML = cssRules.join('\n');
            defs.appendChild(style);
            svg.appendChild(style);
        }
        fonts_1.addFontRules = addFontRules;
        function loadWebFont(name) {
            const observer = new FontFaceObserver(name);
            return observer.load();
        }
        fonts_1.loadWebFont = loadWebFont;
    })(fonts = P.fonts || (P.fonts = {}));
})(P || (P = {}));
var P;
(function (P) {
    var i18n;
    (function (i18n) {
        'use strict';
        const SUPPORTED_LANGUAGES = ['en', 'es'];
        const DEFAULT_LANGUAGE = 'en';
        function getLanguage() {
            let language = navigator.language;
            if (language.indexOf('-') > -1) {
                language = language.substring(0, language.indexOf('-'));
            }
            if (SUPPORTED_LANGUAGES.indexOf(language) === -1) {
                language = DEFAULT_LANGUAGE;
            }
            return language;
        }
        const translations = {};
        const defaultTranslations = {};
        const language = getLanguage();
        function translate(messageId) {
            if (translations[messageId]) {
                return translations[messageId];
            }
            if (defaultTranslations[messageId]) {
                return defaultTranslations[messageId];
            }
            console.warn('Missing translation:', messageId);
            return '## ' + messageId + ' ##';
        }
        i18n.translate = translate;
        function translateElement(element) {
            const translatable = element.querySelectorAll('[data-i18n]');
            for (var i = 0; i < translatable.length; i++) {
                const el = translatable[i];
                const messageId = el.getAttribute('data-i18n');
                if (messageId === null)
                    continue;
                const result = translate(messageId);
                el.textContent = result;
            }
        }
        i18n.translateElement = translateElement;
        function merge(into, source) {
            for (const key of Object.keys(source)) {
                into[key] = source[key];
            }
        }
        function addTranslations(importedLanguage, importedTranslations) {
            if (importedLanguage === language) {
                merge(translations, importedTranslations);
            }
            else if (importedLanguage === DEFAULT_LANGUAGE) {
                merge(defaultTranslations, importedTranslations);
            }
        }
        i18n.addTranslations = addTranslations;
        addTranslations('en', {
            'player.controls.turboIndicator': 'Turbo Mode',
            'player.controls.fullscreen.title': 'Click to fullscreen player, Shift+click to just maximize.',
            'player.controls.flag.title': 'Shift+click to enable turbo mode.',
            'player.controls.flag.title.enabled': 'Turbo mode is enabled. Shift+click to disable turbo mode.',
            'player.controls.flag.title.disabled': 'Turbo mode is disabled. Shift+click to enable turbo mode.',
            'player.errorhandler.error': 'An internal error occurred. <a $attrs>Click here</a> to file a bug report.',
            'player.errorhandler.error.doesnotexist': 'There is no project with ID $id. It was probably deleted, never existed, or you made a typo.',
            'player.errorhandler.error.doesnotexistlegacy': 'The project with ID $id can not be used with legacy mode enabled. Turn off legacy mode to use this project.',
        });
        addTranslations('es', {
            'player.controls.turboIndicator': 'Modo Turbo',
        });
    })(i18n = P.i18n || (P.i18n = {}));
})(P || (P = {}));
var P;
(function (P) {
    var io;
    (function (io) {
        io.config = {
            localPath: '',
        };
        if (['http:', 'https:'].indexOf(location.protocol) === -1) {
            io.config.localPath = 'https://forkphorus.github.io';
        }
        let readers;
        (function (readers) {
            function toArrayBuffer(object) {
                return new Promise((resolve, reject) => {
                    const fileReader = new FileReader();
                    fileReader.onloadend = function () {
                        resolve(fileReader.result);
                    };
                    fileReader.onerror = function (err) {
                        reject(new Error('Could not read object as ArrayBuffer'));
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
                        reject(new Error('Could not read object as data: URL'));
                    };
                    fileReader.readAsDataURL(object);
                });
            }
            readers.toDataURL = toDataURL;
            function toText(object) {
                return new Promise((resolve, reject) => {
                    const fileReader = new FileReader();
                    fileReader.onloadend = function () {
                        resolve(fileReader.result);
                    };
                    fileReader.onerror = function (err) {
                        reject(new Error('Could not read object as text'));
                    };
                    fileReader.readAsText(object);
                });
            }
            readers.toText = toText;
        })(readers = io.readers || (io.readers = {}));
        class FetchingAssetManager {
            constructor() {
                this.soundbankSource = 'soundbank/';
            }
            loadSoundbankFile(src) {
                return this.loadArrayBuffer(this.soundbankSource + src);
            }
            loadFont(src) {
                return this.loadBlob(src);
            }
            loadArrayBuffer(src) {
                return new Request(io.config.localPath + src).load('arraybuffer');
            }
            loadBlob(src) {
                return new Request(io.config.localPath + src).load('blob');
            }
        }
        var globalAssetManager = new FetchingAssetManager();
        function getAssetManager() {
            return globalAssetManager;
        }
        io.getAssetManager = getAssetManager;
        function setAssetManager(newManager) {
            globalAssetManager = newManager;
        }
        io.setAssetManager = setAssetManager;
        class Throttler {
            constructor() {
                this.maxConcurrentTasks = 20;
                this.concurrentTasks = 0;
                this.queue = [];
            }
            startNextTask() {
                if (this.queue.length === 0)
                    return;
                if (this.concurrentTasks >= this.maxConcurrentTasks)
                    return;
                const fn = this.queue.shift();
                this.concurrentTasks++;
                fn();
            }
            run(fn) {
                return new Promise((resolve, reject) => {
                    const run = () => {
                        fn()
                            .then((r) => {
                            this.concurrentTasks--;
                            this.startNextTask();
                            resolve(r);
                        })
                            .catch((e) => {
                            this.concurrentTasks--;
                            this.startNextTask();
                            reject(e);
                        });
                    };
                    if (this.concurrentTasks < this.maxConcurrentTasks) {
                        this.concurrentTasks++;
                        run();
                    }
                    else {
                        this.queue.push(run);
                    }
                });
            }
        }
        const requestThrottler = new Throttler();
        class AbstractTask {
            setLoader(loader) {
                this.loader = loader;
            }
            updateLoaderProgress() {
                if (this.loader) {
                    this.loader.updateProgress();
                }
            }
        }
        io.AbstractTask = AbstractTask;
        class Retry extends AbstractTask {
            constructor() {
                super(...arguments);
                this.aborted = false;
                this.retries = 0;
            }
            async try(handle) {
                const MAX_ATTEMPTS = 4;
                let lastErr;
                for (let i = 0; i < MAX_ATTEMPTS; i++) {
                    this.retries = i;
                    try {
                        return await handle();
                    }
                    catch (err) {
                        if (this.aborted) {
                            throw err;
                        }
                        lastErr = err;
                        const retryIn = 2 ** i * 500 * Math.random() + 50;
                        console.warn(`Attempt #${i + 1} to ${this.getRetryWarningDescription()} failed, trying again in ${retryIn}ms`, err);
                        await P.utils.sleep(retryIn);
                    }
                }
                throw lastErr;
            }
            getRetryWarningDescription() {
                return 'complete task';
            }
            abort() {
                this.aborted = true;
            }
        }
        io.Retry = Retry;
        class Request extends Retry {
            constructor(url) {
                super();
                this.url = url;
                this.shouldIgnoreErrors = false;
                this.complete = false;
                this.status = 0;
                this.xhr = null;
            }
            isComplete() {
                return this.complete;
            }
            abort() {
                super.abort();
                if (this.xhr) {
                    this.xhr.abort();
                }
            }
            ignoreErrors() {
                this.shouldIgnoreErrors = true;
                return this;
            }
            getStatus() {
                return this.status;
            }
            _load() {
                if (this.aborted) {
                    return Promise.reject(new Error(`Cannot download ${this.url} -- aborted.`));
                }
                return new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', this.url);
                    xhr.responseType = this.responseType;
                    this.xhr = xhr;
                    xhr.onload = () => {
                        this.status = xhr.status;
                        if (Request.acceptableResponseCodes.indexOf(xhr.status) !== -1 || this.shouldIgnoreErrors) {
                            resolve(xhr.response);
                        }
                        else {
                            reject(new Error(`HTTP Error ${xhr.status} while downloading ${this.url}`));
                        }
                    };
                    xhr.onloadend = (e) => {
                        this.xhr = null;
                        this.complete = true;
                        this.updateLoaderProgress();
                    };
                    xhr.onerror = (err) => {
                        reject(new Error(`Error while downloading ${this.url} (error) (r=${this.retries} s=${xhr.readyState}/${xhr.status}/${xhr.statusText})`));
                    };
                    xhr.onabort = (err) => {
                        this.aborted = true;
                        reject(new Error(`Error while downloading ${this.url} (abort)`));
                    };
                    xhr.send();
                });
            }
            load(type) {
                this.responseType = type;
                return requestThrottler.run(() => this.try(() => this._load()));
            }
            getRetryWarningDescription() {
                return `download ${this.url}`;
            }
        }
        Request.acceptableResponseCodes = [0, 200];
        io.Request = Request;
        class Img extends Retry {
            constructor(src) {
                super();
                this.src = src;
                this.complete = false;
            }
            isComplete() {
                return this.complete;
            }
            _load() {
                if (this.aborted) {
                    return Promise.reject(new Error(`Cannot download ${this.src} -- aborted.`));
                }
                return new Promise((resolve, reject) => {
                    const image = new Image();
                    image.onload = () => {
                        this.complete = true;
                        this.updateLoaderProgress();
                        image.onload = null;
                        image.onerror = null;
                        resolve(image);
                    };
                    image.onerror = () => {
                        image.onload = null;
                        image.onerror = null;
                        reject(new Error(`Failed to load image: ${image.src} (r=${this.retries})`));
                    };
                    image.crossOrigin = 'anonymous';
                    setTimeout(() => {
                        image.src = this.src;
                    });
                });
            }
            load() {
                return requestThrottler.run(() => this.try(() => this._load()));
            }
            getRetryWarningDescription() {
                return `download image ${this.src}`;
            }
        }
        io.Img = Img;
        class Manual extends AbstractTask {
            constructor() {
                super(...arguments);
                this.complete = false;
                this.aborted = false;
            }
            markComplete() {
                this.complete = true;
                this.updateLoaderProgress();
            }
            isComplete() {
                return this.complete;
            }
            abort() {
                this.aborted = true;
            }
        }
        io.Manual = Manual;
        class PromiseTask extends Manual {
            constructor(promise) {
                super();
                promise.then(() => this.markComplete());
            }
        }
        io.PromiseTask = PromiseTask;
        class Loader {
            constructor() {
                this._tasks = [];
                this.aborted = false;
                this.error = false;
            }
            calculateProgress() {
                if (this.aborted) {
                    return 1;
                }
                const totalTasks = this._tasks.length;
                if (totalTasks === 0) {
                    return 0;
                }
                let finishedTasks = 0;
                for (const task of this._tasks) {
                    if (task.isComplete()) {
                        finishedTasks++;
                    }
                }
                return finishedTasks / totalTasks;
            }
            updateProgress() {
                if (this.error) {
                    return;
                }
                const progress = this.calculateProgress();
                this.onprogress(progress);
            }
            resetTasks() {
                this._tasks = [];
                this.updateProgress();
            }
            addTask(task) {
                this._tasks.push(task);
                task.setLoader(this);
                return task;
            }
            abort() {
                this.aborted = true;
                for (const task of this._tasks) {
                    task.abort();
                }
            }
            cleanup() {
                for (const task of this._tasks) {
                    task.setLoader(null);
                }
                this._tasks.length = 0;
            }
            onprogress(progress) {
            }
        }
        io.Loader = Loader;
    })(io = P.io || (P.io = {}));
})(P || (P = {}));
var P;
(function (P) {
    var json;
    (function (json) {
        class JSONParser {
            constructor(source) {
                this.source = source;
                this.index = 0;
            }
            parse() {
                return this.parseValue();
            }
            lineInfo() {
                let line = 0;
                let column = 0;
                for (var i = 0; i < this.index; i++) {
                    if (this.source[i] === '\n') {
                        line++;
                        column = 0;
                    }
                    else {
                        column++;
                    }
                }
                return { line: line + 1, column: column + 1 };
            }
            error(message) {
                const { line, column } = this.lineInfo();
                throw new SyntaxError(`JSONParser: ${message} (Line ${line} Column ${column})`);
            }
            char() {
                return this.charAt(this.index);
            }
            charAt(index) {
                if (index >= this.source.length) {
                    this.error('Unexpected end of input');
                }
                return this.source[index];
            }
            next() {
                this.index++;
            }
            expect(char) {
                if (this.char() !== char) {
                    this.error(`Expected '${char}' but found '${this.char()}'`);
                }
                this.next();
            }
            peek(length = 1, offset = 1) {
                if (length === 1)
                    return this.charAt(this.index + offset);
                let result = '';
                for (var i = 0; i < length; i++) {
                    result += this.charAt(this.index + offset + i);
                }
                return result;
            }
            skipWhitespace() {
                while (/\s/.test(this.char())) {
                    this.next();
                }
            }
            parseValue() {
                this.skipWhitespace();
                const char = this.char();
                switch (char) {
                    case '"': return this.parseString();
                    case '{': return this.parseObject();
                    case '[': return this.parseList();
                    case '0':
                    case '1':
                    case '2':
                    case '3':
                    case '4':
                    case '5':
                    case '6':
                    case '7':
                    case '8':
                    case '9':
                    case '-':
                        return this.parseNumber();
                    default: return this.parseWord();
                }
            }
            parseWord() {
                if (this.peek(4, 0) === 'null') {
                    for (var i = 0; i < 4; i++)
                        this.next();
                    return null;
                }
                if (this.peek(4, 0) === 'true') {
                    for (var i = 0; i < 4; i++)
                        this.next();
                    return true;
                }
                if (this.peek(5, 0) === 'false') {
                    for (var i = 0; i < 5; i++)
                        this.next();
                    return false;
                }
                if (this.peek(8, 0) === 'Infinity') {
                    for (var i = 0; i < 8; i++)
                        this.next();
                    return Infinity;
                }
                if (this.peek(9, 0) === '-Infinity') {
                    for (var i = 0; i < 9; i++)
                        this.next();
                    return -Infinity;
                }
                if (this.peek(3, 0) === 'NaN') {
                    for (var i = 0; i < 3; i++)
                        this.next();
                    return NaN;
                }
                this.error(`Unknown word (starts with ${this.char()})`);
            }
            parseNumber() {
                let number = '';
                while (true) {
                    number += this.char();
                    if (/[\d\.e+-]/i.test(this.peek())) {
                        this.next();
                    }
                    else {
                        break;
                    }
                }
                this.next();
                const value = +number;
                if (Number.isNaN(value)) {
                    this.error('Not a number: ' + number);
                }
                return value;
            }
            parseString() {
                this.expect('"');
                let result = '';
                if (this.char() === '"') {
                    this.next();
                    return '';
                }
                while (true) {
                    const char = this.char();
                    if (char === '\\') {
                        this.next();
                        switch (this.char()) {
                            case '"':
                                result += '"';
                                break;
                            case '/':
                                result += '/';
                                break;
                            case '\\':
                                result += '\\';
                                break;
                            case 'b':
                                result += '\b';
                                break;
                            case 'f':
                                result += '\f';
                                break;
                            case 'n':
                                result += '\n';
                                break;
                            case 'r':
                                result += '\r';
                                break;
                            case 't':
                                result += '\t';
                                break;
                            case 'u': {
                                let hexString = '';
                                for (var i = 0; i < 4; i++) {
                                    this.next();
                                    const char = this.char();
                                    if (!/[0-9a-f]/i.test(char)) {
                                        this.error('Invalid hex code: ' + char);
                                    }
                                    hexString += char;
                                }
                                const hexNumber = Number.parseInt(hexString, 16);
                                const letter = String.fromCharCode(hexNumber);
                                result += letter;
                                break;
                            }
                            default: this.error('Invalid escape code: \\' + this.char());
                        }
                    }
                    else {
                        result += char;
                    }
                    if (this.peek() === '"') {
                        break;
                    }
                    this.next();
                }
                this.next();
                this.expect('"');
                return result;
            }
            parseList() {
                this.expect('[');
                this.skipWhitespace();
                if (this.char() === ']') {
                    this.next();
                    return [];
                }
                const result = [];
                while (true) {
                    this.skipWhitespace();
                    const value = this.parseValue();
                    result.push(value);
                    this.skipWhitespace();
                    if (this.char() === ']') {
                        break;
                    }
                    this.expect(',');
                }
                this.expect(']');
                return result;
            }
            parseObject() {
                this.expect('{');
                this.skipWhitespace();
                if (this.char() === '}') {
                    this.next();
                    return {};
                }
                const result = Object.create(null);
                while (true) {
                    this.skipWhitespace();
                    const key = this.parseString();
                    this.skipWhitespace();
                    this.expect(':');
                    const value = this.parseValue();
                    result[key] = value;
                    this.skipWhitespace();
                    if (this.char() === '}') {
                        break;
                    }
                    this.expect(',');
                }
                this.expect('}');
                return result;
            }
        }
        function parse(source) {
            if (!/^\s*{/.test(source)) {
                throw new Error('The input does not seem to be a JSON object');
            }
            try {
                return JSON.parse(source);
            }
            catch (firstError) {
                console.warn('JSON.parse failed. Trying alternative parser', firstError);
                try {
                    const parser = new JSONParser(source);
                    return parser.parse();
                }
                catch (secondError) {
                    console.warn('Alternative parser failed', secondError);
                    throw firstError;
                }
            }
        }
        json.parse = parse;
    })(json = P.json || (P.json = {}));
})(P || (P = {}));
var P;
(function (P) {
    var utils;
    (function (utils) {
        function parseRotationStyle(style) {
            switch (style) {
                case 'leftRight':
                case 'left-right':
                    return 1;
                case 'none':
                case 'don\'t rotate':
                    return 2;
                case 'normal':
                case 'all around':
                    return 0;
            }
            console.warn('unknown rotation style', style);
            return 0;
        }
        utils.parseRotationStyle = parseRotationStyle;
        function rgbToHSL(r, g, b) {
            r /= 255;
            g /= 255;
            b /= 255;
            var min = Math.min(r, g, b);
            var max = Math.max(r, g, b);
            if (min === max) {
                return [0, 0, r];
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
            return [h, s, l];
        }
        utils.rgbToHSL = rgbToHSL;
        function rgbToHSV(r, g, b) {
            r /= 255;
            g /= 255;
            b /= 255;
            var max = Math.max(r, g, b), min = Math.min(r, g, b);
            var h, s, v = max;
            var d = max - min;
            s = max == 0 ? 0 : d / max;
            if (max == min) {
                h = 0;
            }
            else {
                switch (max) {
                    case r:
                        h = (g - b) / d + (g < b ? 6 : 0);
                        break;
                    case g:
                        h = (b - r) / d + 2;
                        break;
                    case b:
                        h = (r - g) / d + 4;
                        break;
                }
                h /= 6;
            }
            return [h * 360, s, v];
        }
        utils.rgbToHSV = rgbToHSV;
        function hsvToRGB(h, s, v) {
            var r, g, b;
            var i = Math.floor(h * 6);
            var f = h * 6 - i;
            var p = v * (1 - s);
            var q = v * (1 - f * s);
            var t = v * (1 - (1 - f) * s);
            switch (i % 6) {
                case 0:
                    r = v, g = t, b = p;
                    break;
                case 1:
                    r = q, g = v, b = p;
                    break;
                case 2:
                    r = p, g = v, b = t;
                    break;
                case 3:
                    r = p, g = q, b = v;
                    break;
                case 4:
                    r = t, g = p, b = v;
                    break;
                case 5:
                    r = v, g = p, b = q;
                    break;
            }
            return [r * 255 | 0, g * 255 | 0, b * 255 | 0];
        }
        utils.hsvToRGB = hsvToRGB;
        function hslToRGB(h, s, l) {
            var r, g, b;
            if (s == 0) {
                r = g = b = l;
            }
            else {
                function hue2rgb(p, q, t) {
                    if (t < 0)
                        t += 1;
                    if (t > 1)
                        t -= 1;
                    if (t < 1 / 6)
                        return p + (q - p) * 6 * t;
                    if (t < 1 / 2)
                        return q;
                    if (t < 2 / 3)
                        return p + (q - p) * (2 / 3 - t) * 6;
                    return p;
                }
                var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                var p = 2 * l - q;
                r = hue2rgb(p, q, h + 1 / 3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1 / 3);
            }
            return [r * 255, g * 255, b * 255];
        }
        utils.hslToRGB = hslToRGB;
        function hslToHSV(h, s, l) {
            var v = l + s * Math.min(l, 1 - l);
            var s = v === 0 ? 0 : 2 - 2 * l / v;
            return [h, s, v];
        }
        utils.hslToHSV = hslToHSV;
        function hsvToHSL(h, s, v) {
            var l = v - v * s / 2;
            var s = l === 0 ? 0 : (v - l) / Math.min(2 - 2 * l / v);
            return [h, s, l];
        }
        utils.hsvToHSL = hsvToHSL;
        function clamp(number, min, max) {
            return Math.min(max, Math.max(min, number));
        }
        utils.clamp = clamp;
        function settled(promise) {
            return new Promise((resolve, _reject) => {
                promise
                    .then(() => resolve())
                    .catch(() => resolve());
            });
        }
        utils.settled = settled;
        function sleep(ms) {
            return new Promise((resolve) => setTimeout(resolve, ms));
        }
        utils.sleep = sleep;
        function parseColor(color) {
            if (typeof color === 'number') {
                return color;
            }
            if (typeof color === 'string') {
                const nValue = +color;
                if (!isNaN(nValue)) {
                    return nValue;
                }
                if (color.startsWith('#')) {
                    const hex = color.substr(1);
                    const parsedHex = parseInt(hex, 16);
                    if (hex.length === 6) {
                        return parsedHex;
                    }
                    else if (hex.length === 3) {
                        const r = parsedHex >> 8 & 0xf;
                        const g = parsedHex >> 4 & 0xf;
                        const b = parsedHex & 0xf;
                        return (((r << 4) | r) << 16 |
                            ((g << 4) | g) << 8 |
                            ((b << 4) | b));
                    }
                }
            }
            return 0;
        }
        utils.parseColor = parseColor;
        ;
    })(utils = P.utils || (P.utils = {}));
})(P || (P = {}));
var P;
(function (P) {
    var player;
    (function (player_1) {
        class PlayerError extends Error {
            constructor() {
                super(...arguments);
                this.handledByPlayer = true;
            }
        }
        player_1.PlayerError = PlayerError;
        class ProjectDoesNotExistError extends PlayerError {
            constructor(id) {
                super('Project with ID ' + id + ' does not exist');
                this.id = id;
                this.name = 'ProjectDoesNotExistError';
            }
        }
        player_1.ProjectDoesNotExistError = ProjectDoesNotExistError;
        class LoaderIdentifier {
            constructor() {
                this.active = true;
                this.loader = null;
            }
            cancel() {
                if (!this.active) {
                    throw new Error('cannot cancel: already cancelled');
                }
                this.active = false;
                if (this.loader) {
                    this.loader.abort();
                }
            }
            setLoader(loader) {
                if (!this.active) {
                    throw new Error('Loading aborted');
                }
                this.loader = loader;
            }
            isActive() {
                return this.active;
            }
        }
        class Slot {
            constructor() {
                this._listeners = [];
            }
            subscribe(fn) {
                this._listeners.push(fn);
            }
            emit(value) {
                for (const listener of this._listeners) {
                    listener(value);
                }
            }
        }
        class LocalProjectMeta {
            constructor(filename) {
                this.filename = filename;
            }
            load() {
                return Promise.resolve(this);
            }
            getTitle() {
                return this.filename;
            }
            getId() {
                return this.filename;
            }
            isFromScratch() {
                return false;
            }
        }
        class BinaryProjectMeta {
            load() {
                return Promise.resolve(this);
            }
            getTitle() {
                return null;
            }
            getId() {
                return '#buffer#';
            }
            isFromScratch() {
                return false;
            }
        }
        class RemoteProjectMeta {
            constructor(id) {
                this.id = id;
                this.title = null;
            }
            load() {
                return new P.io.Request('https://trampoline.turbowarp.org/proxy/projects/$id'.replace('$id', this.id))
                    .ignoreErrors()
                    .load('json')
                    .then((data) => {
                    if (data.title) {
                        this.title = data.title;
                    }
                    return this;
                });
            }
            getTitle() {
                return this.title;
            }
            getId() {
                return this.id;
            }
            isFromScratch() {
                return true;
            }
        }
        class Player {
            constructor(options = {}) {
                this.onprogress = new Slot();
                this.onload = new Slot();
                this.onstartload = new Slot();
                this.oncleanup = new Slot();
                this.onthemechange = new Slot();
                this.onerror = new Slot();
                this.onresume = new Slot();
                this.onpause = new Slot();
                this.onoptionschange = new Slot();
                this.MAGIC = {
                    LARGE_Z_INDEX: '9999999999',
                };
                this.stage = null;
                this.projectMeta = null;
                this.currentLoader = null;
                this.fullscreenEnabled = false;
                this.clickToPlayContainer = null;
                this.root = document.createElement('div');
                this.root.className = 'player-root';
                this.playerContainer = document.createElement('div');
                this.playerContainer.className = 'player-stage';
                this.root.appendChild(this.playerContainer);
                this.setOptions(Object.assign(Object.assign({}, options), Player.DEFAULT_OPTIONS));
                window.addEventListener('resize', () => this.updateFullscreen());
                document.addEventListener('fullscreenchange', () => this.onfullscreenchange());
                document.addEventListener('mozfullscreenchange', () => this.onfullscreenchange());
                document.addEventListener('webkitfullscreenchange', () => this.onfullscreenchange());
                this.handleError = this.handleError.bind(this);
            }
            enableAttribute(name) {
                this.root.setAttribute(name, '');
            }
            disableAttribute(name) {
                this.root.removeAttribute(name);
            }
            setAttribute(name, enabled) {
                if (enabled) {
                    this.enableAttribute(name);
                }
                else {
                    this.disableAttribute(name);
                }
            }
            setOptions(changedOptions) {
                this.options = Object.assign(Object.assign({}, this.options), changedOptions);
                if (typeof changedOptions.turbo !== 'undefined') {
                    this.setAttribute('turbo', changedOptions.turbo);
                }
                if (typeof changedOptions.theme !== 'undefined') {
                    this.root.setAttribute('theme', changedOptions.theme);
                    this.onthemechange.emit(changedOptions.theme);
                }
                if (this.hasStage()) {
                    this.applyOptionsToStage();
                }
                this.onoptionschange.emit(changedOptions);
            }
            getOptions() {
                return this.options;
            }
            addControls(options = {}) {
                if (this.controlsContainer) {
                    throw new Error('This player already has controls.');
                }
                let flagTouchTimeout = undefined;
                const clickStop = (e) => {
                    this.throwWithoutStage();
                    this.stopAll();
                    this.stage.draw();
                    e.preventDefault();
                };
                const clickPause = (e) => {
                    this.toggleRunning();
                };
                const clickFullscreen = (e) => {
                    this.throwWithoutStage();
                    this.setOptions({ fullscreenMode: e.shiftKey ? 'window' : 'full' });
                    if (this.fullscreenEnabled) {
                        this.exitFullscreen();
                    }
                    else {
                        this.enterFullscreen();
                    }
                };
                const clickFlag = (e) => {
                    if (flagTouchTimeout === null) {
                        return;
                    }
                    if (flagTouchTimeout) {
                        clearTimeout(flagTouchTimeout);
                    }
                    this.throwWithoutStage();
                    if (e.shiftKey) {
                        this.setOptions({ turbo: !this.options.turbo });
                    }
                    else {
                        this.triggerGreenFlag();
                    }
                    this.focus();
                    e.preventDefault();
                };
                const startTouchFlag = (e) => {
                    flagTouchTimeout = setTimeout(() => {
                        flagTouchTimeout = null;
                        this.setOptions({ turbo: !this.options.turbo });
                    }, 500);
                };
                const preventDefault = (e) => {
                    e.preventDefault();
                };
                this.controlsContainer = document.createElement('div');
                this.controlsContainer.className = 'player-controls';
                this.controlsContainer.onmousedown = (e) => {
                    if (e.target !== this.controlsContainer) {
                        e.stopPropagation();
                    }
                };
                this.controlsContainer.ontouchstart = (e) => {
                    if (e.target !== this.controlsContainer) {
                        e.stopPropagation();
                    }
                };
                if (options.enableStop !== false) {
                    var stopButton = document.createElement('span');
                    stopButton.className = 'player-button player-stop';
                    this.controlsContainer.appendChild(stopButton);
                    stopButton.addEventListener('click', clickStop);
                    stopButton.addEventListener('touchend', clickStop);
                    stopButton.addEventListener('touchstart', preventDefault);
                }
                if (options.enablePause !== false) {
                    var pauseButton = document.createElement('span');
                    pauseButton.className = 'player-button player-pause';
                    this.controlsContainer.appendChild(pauseButton);
                    pauseButton.addEventListener('click', clickPause);
                    pauseButton.addEventListener('touchend', clickPause);
                    pauseButton.addEventListener('touchstart', preventDefault);
                }
                if (options.enableFlag !== false) {
                    var flagButton = document.createElement('span');
                    flagButton.className = 'player-button player-flag';
                    flagButton.title = P.i18n.translate('player.controls.flag.title');
                    this.controlsContainer.appendChild(flagButton);
                    flagButton.addEventListener('click', clickFlag);
                    flagButton.addEventListener('touchend', clickFlag);
                    flagButton.addEventListener('touchstart', startTouchFlag);
                    flagButton.addEventListener('touchstart', preventDefault);
                }
                if (options.enableTurbo !== false) {
                    var turboText = document.createElement('span');
                    turboText.innerText = P.i18n.translate('player.controls.turboIndicator');
                    turboText.className = 'player-label player-turbo';
                    this.controlsContainer.appendChild(turboText);
                    this.onoptionschange.subscribe((options) => {
                        if (flagButton && typeof options.turbo === 'boolean') {
                            if (options.turbo) {
                                flagButton.title = P.i18n.translate('player.controls.flag.title.enabled');
                            }
                            else {
                                flagButton.title = P.i18n.translate('player.controls.flag.title.disabled');
                            }
                        }
                    });
                }
                if (options.enableFullscreen !== false) {
                    var fullscreenButton = document.createElement('span');
                    fullscreenButton.className = 'player-button player-fullscreen-btn';
                    fullscreenButton.title = P.i18n.translate('player.controls.fullscreen.title');
                    this.controlsContainer.appendChild(fullscreenButton);
                    fullscreenButton.addEventListener('click', clickFullscreen);
                    fullscreenButton.addEventListener('touchend', clickFullscreen);
                    fullscreenButton.addEventListener('touchstart', preventDefault);
                }
                this.root.addEventListener('touchmove', (e) => {
                    if (this.fullscreenEnabled) {
                        e.preventDefault();
                    }
                });
                this.root.insertBefore(this.controlsContainer, this.root.firstChild);
            }
            applyOptionsToStage() {
                if (this.stage.runtime.framerate !== this.options.fps) {
                    this.stage.runtime.framerate = this.options.fps;
                    if (this.isRunning()) {
                        this.stage.runtime.resetInterval();
                    }
                }
                this.stage.username = this.options.username;
                this.stage.runtime.isTurbo = this.options.turbo;
                this.stage.useSpriteFencing = this.options.spriteFencing;
                this.stage.removeLimits = this.options.removeLimits;
                this.stage.renderer.imageSmoothingEnabled = this.options.imageSmoothing;
            }
            generateUsernameIfMissing() {
                if (!this.options.username) {
                    this.setOptions({
                        username: 'player' + Math.random().toFixed(10).substr(2, 6)
                    });
                }
            }
            throwWithoutStage() {
                if (!this.stage) {
                    throw new Error('Missing stage.');
                }
            }
            resume() {
                this.throwWithoutStage();
                if (this.isRunning()) {
                    throw new Error('cannot resume: project is already running');
                }
                this.stage.runtime.start();
                this.enableAttribute('running');
                this.onresume.emit();
            }
            pause() {
                this.throwWithoutStage();
                if (!this.isRunning()) {
                    throw new Error('cannot pause: project is already paused');
                }
                this.stage.runtime.pause();
                this.disableAttribute('running');
                this.onpause.emit();
            }
            isRunning() {
                if (!this.hasStage()) {
                    return false;
                }
                return this.stage.runtime.isRunning;
            }
            toggleRunning() {
                this.throwWithoutStage();
                if (this.stage.runtime.isRunning) {
                    this.pause();
                }
                else {
                    this.resume();
                }
            }
            stopAll() {
                this.throwWithoutStage();
                this.pause();
                this.stage.runtime.stopAll();
            }
            triggerGreenFlag() {
                this.throwWithoutStage();
                if (!this.isRunning()) {
                    this.resume();
                }
                this.stage.runtime.stopAll();
                this.stage.runtime.triggerGreenFlag();
                if (this.clickToPlayContainer) {
                    this.removeClickToPlayContainer();
                }
            }
            cleanup() {
                if (this.currentLoader) {
                    this.currentLoader.cancel();
                    this.currentLoader = null;
                }
                if (this.clickToPlayContainer) {
                    this.removeClickToPlayContainer();
                }
                if (this.fullscreenEnabled) {
                    this.exitFullscreen();
                }
                if (this.stage) {
                    this.stage.destroy();
                    this.stage = null;
                }
                this.projectMeta = null;
                while (this.playerContainer.firstChild) {
                    this.playerContainer.removeChild(this.playerContainer.firstChild);
                }
                this.oncleanup.emit();
            }
            focus() {
                this.stage.focus();
            }
            hasStage() {
                return !!this.stage;
            }
            getStage() {
                this.throwWithoutStage();
                return this.stage;
            }
            hasProjectMeta() {
                return !!this.projectMeta;
            }
            getProjectMeta() {
                if (!this.projectMeta) {
                    throw new Error('no project meta');
                }
                return this.projectMeta;
            }
            handleError(error) {
                console.error(error);
                this.onerror.emit(error);
            }
            enterFullscreen() {
                this.savedTheme = this.root.getAttribute('theme');
                this.setOptions({ theme: 'dark' });
                if (this.options.fullscreenMode === 'full') {
                    if (this.root.requestFullScreenWithKeys) {
                        this.root.requestFullScreenWithKeys();
                    }
                    else if (this.root.webkitRequestFullScreen) {
                        this.root.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
                    }
                    else if (this.root.requestFullscreen) {
                        this.root.requestFullscreen();
                    }
                }
                document.body.classList.add('player-body-fullscreen');
                this.root.style.zIndex = this.MAGIC.LARGE_Z_INDEX;
                this.enableAttribute('fullscreen');
                this.fullscreenEnabled = true;
                if (this.hasStage()) {
                    if (!this.isRunning()) {
                        this.stage.draw();
                    }
                    if (this.options.focusOnLoad) {
                        this.focus();
                    }
                }
                this.updateFullscreen();
            }
            exitFullscreen() {
                this.setOptions({ theme: this.savedTheme });
                this.disableAttribute('fullscreen');
                this.fullscreenEnabled = false;
                if (document.fullscreenElement === this.root || document.webkitFullscreenElement === this.root) {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    }
                    else if (document.mozCancelFullScreen) {
                        document.mozCancelFullScreen();
                    }
                    else if (document.webkitCancelFullScreen) {
                        document.webkitCancelFullScreen();
                    }
                    else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    }
                }
                this.root.style.paddingLeft = '';
                this.root.style.paddingTop = '';
                this.root.style.zIndex = '';
                if (this.controlsContainer) {
                    this.controlsContainer.style.width = '';
                }
                document.body.classList.remove('player-body-fullscreen');
                if (this.stage) {
                    this.stage.setZoom(1);
                    this.focus();
                }
            }
            updateFullscreen() {
                if (!this.fullscreenEnabled) {
                    return;
                }
                this.throwWithoutStage();
                const controlsHeight = this.controlsContainer ? this.controlsContainer.offsetHeight : 0;
                window.scrollTo(0, 0);
                let w = window.innerWidth - this.options.fullscreenPadding * 2;
                let h = window.innerHeight - this.options.fullscreenPadding - controlsHeight;
                w = Math.min(w, h / 0.75);
                w = Math.min(w, this.options.fullscreenMaxWidth);
                h = w * 0.75 + controlsHeight;
                if (this.controlsContainer) {
                    this.controlsContainer.style.width = w + 'px';
                }
                this.root.style.paddingLeft = (window.innerWidth - w) / 2 + 'px';
                this.root.style.paddingTop = (window.innerHeight - h - this.options.fullscreenPadding) / 2 + 'px';
                this.stage.setZoom(w / 480);
            }
            onfullscreenchange() {
                if (typeof document.fullscreen === 'boolean' && document.fullscreen !== this.fullscreenEnabled) {
                    this.exitFullscreen();
                }
                else if (typeof document.webkitIsFullScreen === 'boolean' && document.webkitIsFullScreen !== this.fullscreenEnabled) {
                    this.exitFullscreen();
                }
            }
            applyCloudVariablesSocket(stage, id) {
                this.generateUsernameIfMissing();
                const handler = new P.ext.cloud.WebSocketCloudHandler(stage, this.options.cloudHost, id);
                stage.setCloudHandler(handler);
            }
            applyCloudVariablesLocalStorage(stage, id) {
                const handler = new P.ext.cloud.LocalStorageCloudHandler(stage, id);
                stage.setCloudHandler(handler);
            }
            applyCloudVariables(policy) {
                const stage = this.stage;
                const meta = this.projectMeta;
                if (!meta) {
                    throw new Error('cannot apply cloud variable settings without projectMeta');
                }
                const hasCloudVariables = stage.cloudVariables.length > 0;
                if (!hasCloudVariables) {
                    return;
                }
                switch (policy) {
                    case 'ws':
                        if (meta.isFromScratch()) {
                            this.applyCloudVariablesSocket(stage, meta.getId());
                        }
                        break;
                    case 'localStorage':
                        this.applyCloudVariablesLocalStorage(stage, meta.getId());
                        break;
                }
            }
            applyAutoplayPolicy(policy) {
                switch (policy) {
                    case 'always': {
                        this.triggerGreenFlag();
                        break;
                    }
                    case 'if-audio-playable': {
                        if (!P.audio.context || P.audio.context.state === 'running') {
                            this.triggerGreenFlag();
                        }
                        else {
                            this.showClickToPlayContainer();
                        }
                        break;
                    }
                    case 'never': {
                        this.showClickToPlayContainer();
                        break;
                    }
                }
            }
            showClickToPlayContainer() {
                if (this.clickToPlayContainer) {
                    throw new Error('cannot show click-to-play interface: already shown');
                }
                this.clickToPlayContainer = document.createElement('div');
                this.clickToPlayContainer.className = 'player-click-to-play-container';
                this.clickToPlayContainer.onclick = () => {
                    if (P.audio.context && P.audio.context.state !== 'running') {
                        P.audio.context.resume();
                    }
                    this.removeClickToPlayContainer();
                    this.triggerGreenFlag();
                    this.focus();
                };
                const content = document.createElement('div');
                content.className = 'player-click-to-play-icon';
                this.clickToPlayContainer.appendChild(content);
                this.stage.ui.appendChild(this.clickToPlayContainer);
            }
            removeClickToPlayContainer() {
                if (this.clickToPlayContainer === null) {
                    throw new Error('cannot hide click-to-play interface: already hidden');
                }
                this.stage.ui.removeChild(this.clickToPlayContainer);
                this.clickToPlayContainer = null;
            }
            beginLoadingProject() {
                this.cleanup();
                this.onstartload.emit();
                const loaderId = new LoaderIdentifier();
                this.currentLoader = loaderId;
                return { loaderId };
            }
            determineProjectType(data) {
                if ('objName' in data)
                    return 'sb2';
                if ('targets' in data)
                    return 'sb3';
                throw new Error('Unknown project type');
            }
            isScratch1Project(buffer) {
                const MAGIC = 'ScratchV0';
                const array = new Uint8Array(buffer);
                for (var i = 0; i < MAGIC.length; i++) {
                    if (String.fromCharCode(array[i]) !== MAGIC[i]) {
                        return false;
                    }
                }
                return true;
            }
            convertScratch1Project(buffer) {
                const sb1 = new ScratchSB1Converter.SB1File(buffer);
                const projectData = sb1.json;
                const zipFiles = sb1.zip.files;
                const zip = new JSZip();
                zip.file('project.json', JSON.stringify(projectData));
                for (const fileName of Object.keys(zipFiles)) {
                    zip.file(fileName, zipFiles[fileName].bytes);
                }
                return zip.generateAsync({ type: 'arraybuffer' });
            }
            fetchProject(id) {
                const request = new P.io.Request(this.options.projectHost.replace('$id', id));
                return request
                    .ignoreErrors()
                    .load('blob')
                    .then(function (response) {
                    if (request.getStatus() === 404) {
                        throw new ProjectDoesNotExistError(id);
                    }
                    return response;
                });
            }
            setStage(stage) {
                this.stage = stage;
                this.stage.runtime.handleError = this.handleError;
                this.applyOptionsToStage();
                this.playerContainer.appendChild(stage.root);
                if (this.options.focusOnLoad) {
                    this.focus();
                }
                this.onload.emit(stage);
                this.stage.draw();
                this.applyCloudVariables(this.options.cloudVariables);
                this.applyAutoplayPolicy(this.options.autoplayPolicy);
            }
            async loadLoader(loaderId, loader) {
                loaderId.setLoader(loader);
                loader.onprogress = (progress) => {
                    if (loaderId.isActive()) {
                        this.onprogress.emit(progress);
                    }
                };
                const stage = await loader.load();
                this.setStage(stage);
                this.currentLoader = null;
                loader.cleanup();
                return stage;
            }
            async loadProjectById(id) {
                const { loaderId } = this.beginLoadingProject();
                const getLoader = async (blob) => {
                    try {
                        const projectText = await P.io.readers.toText(blob);
                        const projectJson = P.json.parse(projectText);
                        switch (this.determineProjectType(projectJson)) {
                            case 'sb2': return new P.sb2.Scratch2Loader(projectJson);
                            case 'sb3': return new P.sb3.Scratch3Loader(projectJson);
                        }
                    }
                    catch (e) {
                        let buffer = await P.io.readers.toArrayBuffer(blob);
                        if (this.isScratch1Project(buffer)) {
                            buffer = await this.convertScratch1Project(buffer);
                        }
                        else {
                            try {
                                const zip = await JSZip.loadAsync(buffer);
                                const projectJSON = zip.file('project.json');
                                if (!projectJSON) {
                                    throw new Error('zip is missing project.json');
                                }
                                const projectDataText = await projectJSON.async('text');
                                const projectData = JSON.parse(projectDataText);
                                if (this.determineProjectType(projectData) === 'sb3') {
                                    return new P.sb3.SB3FileLoader(buffer);
                                }
                            }
                            catch (e) {
                            }
                        }
                        return new P.sb2.SB2FileLoader(buffer);
                    }
                };
                try {
                    this.projectMeta = new RemoteProjectMeta(id);
                    const blob = await this.fetchProject(id);
                    const loader = await getLoader(blob);
                    await this.loadLoader(loaderId, loader);
                }
                catch (e) {
                    if (loaderId.isActive()) {
                        this.handleError(e);
                    }
                }
            }
            async loadProjectFromBufferWithType(loaderId, buffer, type) {
                let loader;
                if (type === 'sb') {
                    buffer = await this.convertScratch1Project(buffer);
                    type = 'sb2';
                }
                switch (type) {
                    case 'sb2':
                        loader = new P.sb2.SB2FileLoader(buffer);
                        break;
                    case 'sb3':
                        loader = new P.sb3.SB3FileLoader(buffer);
                        break;
                    default: throw new Error('Unknown type: ' + type);
                }
                await this.loadLoader(loaderId, loader);
            }
            async loadProjectFromFile(file) {
                const { loaderId } = this.beginLoadingProject();
                try {
                    this.projectMeta = new LocalProjectMeta(file.name);
                    const extension = file.name.split('.').pop() || '';
                    const buffer = await P.io.readers.toArrayBuffer(file);
                    switch (extension) {
                        case 'sb': return await this.loadProjectFromBufferWithType(loaderId, buffer, 'sb');
                        case 'sb2': return await this.loadProjectFromBufferWithType(loaderId, buffer, 'sb2');
                        case 'sb3': return await this.loadProjectFromBufferWithType(loaderId, buffer, 'sb3');
                        default: throw new Error('Unrecognized file extension: ' + extension);
                    }
                }
                catch (e) {
                    if (loaderId.isActive()) {
                        this.handleError(e);
                    }
                }
            }
            async loadProjectFromBuffer(buffer, type) {
                const { loaderId } = this.beginLoadingProject();
                try {
                    this.projectMeta = new BinaryProjectMeta();
                    return await this.loadProjectFromBufferWithType(loaderId, buffer, type);
                }
                catch (e) {
                    if (loaderId.isActive()) {
                        this.handleError(e);
                    }
                }
            }
        }
        Player.DEFAULT_OPTIONS = {
            autoplayPolicy: 'always',
            cloudVariables: 'ws',
            fps: 30,
            theme: 'light',
            turbo: false,
            username: '',
            fullscreenMode: 'full',
            fullscreenPadding: 8,
            fullscreenMaxWidth: Infinity,
            imageSmoothing: false,
            focusOnLoad: true,
            spriteFencing: false,
            removeLimits: false,
            projectHost: 'https://projects.scratch.mit.edu/$id',
            cloudHost: ['wss://stratus.turbowarp.org', 'wss://stratus.turbowarp.xyz']
        };
        player_1.Player = Player;
        class ErrorHandler {
            constructor(player, options = {}) {
                this.player = player;
                this.errorEl = null;
                this.errorContainer = null;
                this.generatedErrorLink = null;
                this.player = player;
                player.onerror.subscribe(this.onerror.bind(this));
                player.oncleanup.subscribe(this.oncleanup.bind(this));
                this.errorEl = null;
                if (options.container) {
                    this.errorContainer = options.container;
                }
                else {
                    this.errorContainer = null;
                }
            }
            stringifyError(error) {
                if (!error) {
                    return 'unknown error';
                }
                if (error.stack) {
                    return 'Message: ' + error.message + '\nStack:\n' + error.stack;
                }
                return '' + error;
            }
            createBugReportLink(error) {
                const type = error ? '[Error]' : '[Bug]';
                const title = `${type} ${this.getBugReportTitle()}`;
                const body = this.getBugReportBody(error);
                return ErrorHandler.BUG_REPORT_LINK
                    .replace('$title', encodeURIComponent(title))
                    .replace('$body', encodeURIComponent(body));
            }
            getBugReportTitle() {
                if (!this.player.hasProjectMeta()) {
                    return 'Unknown Project';
                }
                const meta = this.player.getProjectMeta();
                const title = meta.getTitle();
                const id = meta.getId();
                if (title) {
                    return title;
                }
                if (id) {
                    return id;
                }
                return 'Unknown Project';
            }
            getBugReportBody(error) {
                const sections = [];
                sections.push({
                    title: 'Describe the bug, including any steps to reproduce it',
                    body: '',
                });
                sections.push({
                    title: 'Project ID, URL, or file',
                    body: this.getProjectInformation(),
                });
                let debug = '';
                debug += location.href + '\n';
                debug += navigator.userAgent + '\n';
                if (error) {
                    debug += '```\n' + this.stringifyError(error) + '\n```';
                }
                sections.push({
                    title: 'Debug information <!-- DO NOT EDIT -->',
                    body: debug,
                });
                return sections
                    .map((i) => `**${i.title}**\n${i.body}\n`)
                    .join('\n')
                    .trim();
            }
            getProjectInformation() {
                if (!this.player.hasProjectMeta()) {
                    return 'no project meta loaded';
                }
                const projectMeta = this.player.getProjectMeta();
                if (projectMeta.isFromScratch()) {
                    if (projectMeta.getTitle()) {
                        return 'https://scratch.mit.edu/projects/' + projectMeta.getId();
                    }
                    else {
                        return 'https://scratch.mit.edu/projects/' + projectMeta.getId() + ' (probably unshared)';
                    }
                }
                return 'Not from Scratch: ' + projectMeta.getId();
            }
            oncleanup() {
                if (this.errorEl && this.errorEl.parentNode) {
                    this.errorEl.parentNode.removeChild(this.errorEl);
                    this.errorEl = null;
                }
                this.generatedErrorLink = null;
            }
            handleError(error) {
                const el = document.createElement('div');
                const errorLink = this.createBugReportLink(error);
                this.generatedErrorLink = errorLink;
                const attributes = 'href="' + errorLink + '" target="_blank" ref="noopener"';
                el.innerHTML = P.i18n.translate('player.errorhandler.error').replace('$attrs', attributes);
                return el;
            }
            handleDoesNotExistError(error) {
                const el = document.createElement('div');
                const LEGACY_HOST = 'https://projects.scratch.mit.edu/internalapi/project/$id/get/';
                if (this.player.getOptions().projectHost === LEGACY_HOST) {
                    el.textContent = P.i18n.translate('player.errorhandler.error.doesnotexistlegacy').replace('$id', error.id);
                }
                else {
                    el.textContent = P.i18n.translate('player.errorhandler.error.doesnotexist').replace('$id', error.id);
                }
                return el;
            }
            onerror(error) {
                const el = document.createElement('div');
                el.className = 'player-error';
                if (error instanceof ProjectDoesNotExistError) {
                    el.appendChild(this.handleDoesNotExistError(error));
                }
                else {
                    el.appendChild(this.handleError(error));
                }
                if (this.errorContainer) {
                    this.errorContainer.appendChild(el);
                }
                else if (this.player.hasStage()) {
                    this.player.getStage().ui.appendChild(el);
                }
                else {
                    this.player.playerContainer.appendChild(el);
                }
                this.errorEl = el;
            }
        }
        ErrorHandler.BUG_REPORT_LINK = 'https://github.com/forkphorus/forkphorus/issues/new?template=bug_report.md&labels=bug&title=$title&body=$body&';
        player_1.ErrorHandler = ErrorHandler;
        class ProgressBar {
            constructor(player, options = {}) {
                this.el = document.createElement('div');
                this.el.className = 'player-progress';
                this.bar = document.createElement('div');
                this.bar.className = 'player-progress-fill';
                this.el.appendChild(this.bar);
                this.setTheme(player.getOptions().theme);
                player.onthemechange.subscribe((theme) => this.setTheme(theme));
                player.onprogress.subscribe((progress) => this.setProgress(progress));
                player.onstartload.subscribe(() => {
                    this.el.setAttribute('state', 'loading');
                    this.setProgress(0);
                });
                player.onload.subscribe(() => {
                    this.el.setAttribute('state', 'loaded');
                });
                player.oncleanup.subscribe(() => {
                    this.el.setAttribute('state', '');
                    this.bar.style.width = '0%';
                });
                player.onerror.subscribe(() => {
                    this.el.setAttribute('state', 'error');
                    this.bar.style.width = '100%';
                });
                if (options.position === 'controls' || options.position === undefined) {
                    if (!player.controlsContainer) {
                        throw new Error('No controls to put progess bar in.');
                    }
                    player.controlsContainer.appendChild(this.el);
                }
                else {
                    options.position.appendChild(this.el);
                }
            }
            setTheme(theme) {
                this.el.setAttribute('theme', theme);
            }
            setProgress(progress) {
                this.bar.style.width = 10 + progress * 90 + '%';
            }
        }
        player_1.ProgressBar = ProgressBar;
    })(player = P.player || (P.player = {}));
})(P || (P = {}));
var P;
(function (P) {
    var runtime;
    (function (runtime_1) {
        var runtime;
        var self;
        var S;
        var R;
        var STACK;
        var C;
        var CALLS;
        var WARP;
        var BASE;
        var THREAD;
        var IMMEDIATE;
        var VISUAL;
        const epoch = Date.UTC(2000, 0, 1);
        const INSTRUMENTS = P.audio.instruments;
        const DRUMS = P.audio.drums;
        const DIGIT = /\d/;
        var bool = function (v) {
            return +v !== 0 && v !== '' && v !== 'false' && v !== false;
        };
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
        var equal = function (x, y) {
            if ((typeof x === 'number' || typeof x === 'boolean' || DIGIT.test(x)) && (typeof y === 'number' || typeof x === 'boolean' || DIGIT.test(y))) {
                var nx = +x;
                var ny = +y;
                if (nx === nx && ny === ny) {
                    return nx === ny;
                }
            }
            var xs = ('' + x).toLowerCase();
            var ys = ('' + y).toLowerCase();
            return xs === ys;
        };
        var numEqual = function (nx, y) {
            if (typeof y === 'number' || DIGIT.test(y)) {
                var ny = +y;
                return ny === ny && nx === ny;
            }
            return false;
        };
        var numEqualExperimental = function (nx, y) {
            var ny = +y;
            return ny === ny && nx === ny;
        };
        var numLessExperimental = function (nx, y) {
            var ny = +y;
            return ny === ny && nx < y;
        };
        var numGreaterExperimental = function (nx, y) {
            var ny = +y;
            return ny === ny && nx > y;
        };
        var strEqual = function (a, b) {
            return (a + '').toLowerCase() === (b + '').toLowerCase();
        };
        var stringContains = function (baseString, needle) {
            return baseString.toLowerCase().indexOf(needle.toLowerCase()) > -1;
        };
        var mod = function (x, y) {
            var r = x % y;
            if (r / y < 0) {
                r += y;
            }
            return r;
        };
        var random = function (x, y) {
            var fractional = (typeof x === 'string' && !isNaN(+x) && x.indexOf('.') > -1) ||
                (typeof y === 'string' && !isNaN(+y) && y.indexOf('.') > -1);
            x = +x || 0;
            y = +y || 0;
            if (x > y) {
                var tmp = y;
                y = x;
                x = tmp;
            }
            if (!fractional && (x % 1 === 0 && y % 1 === 0)) {
                return Math.floor(Math.random() * (y - x + 1)) + x;
            }
            return Math.random() * (y - x) + x;
        };
        var clone = function (name) {
            const parent = name === '_myself_' ? S : self.getObject(name);
            if (!parent || !P.core.isSprite(parent)) {
                return;
            }
            const c = parent.clone();
            self.children.splice(self.children.indexOf(parent), 0, c);
            runtime.triggerFor(c, 'whenCloned');
            if (c.visible) {
                VISUAL = true;
            }
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
            for (var i = 0; i < list.length; i++) {
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
        var watchedAppendToList = function (list, value) {
            appendToList(list, value);
            if (!list.modified)
                list.modified = true;
        };
        var watchedDeleteLineOfList = function (list, index) {
            deleteLineOfList(list, index);
            if (!list.modified)
                list.modified = true;
        };
        var watchedDeleteAllOfList = function (list) {
            list.length = 0;
            if (!list.modified)
                list.modified = true;
        };
        var watchedInsertInList = function (list, index, value) {
            insertInList(list, index, value);
            if (!list.modified)
                list.modified = true;
        };
        var watchedSetLineOfList = function (list, index, value) {
            setLineOfList(list, index, value);
            if (!list.modified)
                list.modified = true;
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
        function getKeyCode(keyName) {
            keyName = keyName + '';
            switch (keyName.toLowerCase()) {
                case 'space': return "32";
                case 'left arrow': return "left arrow";
                case 'up arrow': return "up arrow";
                case 'right arrow': return "right arrow";
                case 'down arrow': return "down arrow";
                case 'any': return 'any';
            }
            return '' + keyName.toUpperCase().charCodeAt(0);
        }
        runtime_1.getKeyCode = getKeyCode;
        var getKeyCode3 = function (keyName) {
            switch (keyName.toLowerCase()) {
                case 'space': return "32";
                case 'left arrow': return "left arrow";
                case 'up arrow': return "up arrow";
                case 'right arrow': return "right arrow";
                case 'down arrow': return "down arrow";
                case 'enter': return "enter";
                case 'any': return 'any';
            }
            return '' + keyName.toUpperCase().charCodeAt(0);
        };
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
                return playSpan(span, key, duration);
            };
            var playSpan = function (span, key, duration) {
                const node = P.audio.playSpan(span, key, duration, S.getAudioNode());
                return {
                    stopped: false,
                    node,
                    base: BASE,
                };
            };
            var applySoundEffects = function (node) {
                node.playbackRate.value = Math.pow(2, (S.soundFilters.pitch / 10 / 12));
            };
            var updateSoundEffectsOnAllSounds = function () {
                for (const sound of S.activeSounds) {
                    if (sound.node) {
                        applySoundEffects(sound.node);
                    }
                }
            };
            var playSound = function (sound) {
                const node = sound.createSourceNode();
                applySoundEffects(node);
                node.connect(S.getAudioNode());
                return {
                    stopped: false,
                    node,
                    base: BASE,
                };
            };
            var startSound = function (sound) {
                for (const s of S.activeSounds) {
                    if (s.node === sound.source) {
                        s.stopped = true;
                        break;
                    }
                }
                const node = sound.createSourceNode();
                applySoundEffects(node);
                node.connect(S.getAudioNode());
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
                    if (VISUAL) {
                        for (var i = CALLS.length, j = 5; i-- && j--;) {
                            if (CALLS[i].base === procedure.fn) {
                                runtime.queue[THREAD] = {
                                    sprite: S,
                                    base: BASE,
                                    fn: procedure.fn,
                                    calls: CALLS,
                                    warp: WARP
                                };
                                return;
                            }
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
        var cloudVariableChanged = function (name) {
            if (self.cloudHandler) {
                self.cloudHandler.variableChanged(name);
            }
        };
        var parseColor = function (color) {
            return P.utils.parseColor(color);
        };
        var sceneChange = function () {
            return runtime.trigger('whenSceneStarts', self.getCostumeName());
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
            runtime.queue[THREAD] = {
                sprite: S,
                base: BASE,
                fn: S.fns[id],
                calls: CALLS,
                warp: WARP
            };
        };
        class Runtime {
            constructor(stage) {
                this.stage = stage;
                this.queue = [];
                this.isRunning = false;
                this.timerStart = 0;
                this.baseTime = 0;
                this.baseNow = 0;
                this.isTurbo = false;
                this.framerate = 30;
                this.currentMSecs = 0;
                this.whenTimerMSecs = 0;
                this.onError = this.onError.bind(this);
                this.step = this.step.bind(this);
            }
            startThread(sprite, base, replaceExisting) {
                const thread = {
                    sprite: sprite,
                    base: base,
                    fn: base,
                    calls: [{
                            args: [],
                            stack: [{}],
                        }],
                    warp: 0
                };
                for (let i = 0; i < this.queue.length; i++) {
                    const q = this.queue[i];
                    if (q && q.sprite === sprite && q.base === base) {
                        if (replaceExisting) {
                            this.queue[i] = thread;
                        }
                        return;
                    }
                }
                this.queue.push(thread);
            }
            triggerFor(sprite, event, arg) {
                let threads;
                let replaceExisting = true;
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
                        replaceExisting = false;
                        threads = sprite.listeners.whenKeyPressed[arg] || [];
                        if (arg !== 'any') {
                            const anyThreads = sprite.listeners.whenKeyPressed.any;
                            if (anyThreads) {
                                threads = threads.concat(anyThreads);
                            }
                        }
                        break;
                    case 'whenSceneStarts':
                        threads = sprite.listeners.whenSceneStarts[('' + arg).toLowerCase()];
                        break;
                    case 'whenIReceive':
                        arg = '' + arg;
                        threads = sprite.listeners.whenIReceive[arg] || sprite.listeners.whenIReceive[arg.toLowerCase()];
                        break;
                    case 'edgeActivated':
                        threads = sprite.listeners.edgeActivated;
                        break;
                    default: throw new Error('Unknown trigger event: ' + event);
                }
                if (threads) {
                    for (let i = 0; i < threads.length; i++) {
                        this.startThread(sprite, threads[i], replaceExisting);
                    }
                }
                return threads || [];
            }
            trigger(event, arg) {
                let threads = [];
                for (let i = this.stage.children.length; i--;) {
                    threads = threads.concat(this.triggerFor(this.stage.children[i], event, arg));
                }
                return threads.concat(this.triggerFor(this.stage, event, arg));
            }
            triggerGreenFlag() {
                this.timerStart = this.now();
                this.trigger('whenGreenFlag');
                this.trigger('edgeActivated');
            }
            start() {
                this.isRunning = true;
                if (this.interval)
                    return;
                window.addEventListener('error', this.onError);
                this.baseTime = Date.now();
                this.interval = setInterval(this.step, 1000 / this.framerate);
                if (audioContext)
                    audioContext.resume();
                this.stage.startExtensions();
            }
            pause() {
                if (this.interval) {
                    this.baseNow = this.now();
                    clearInterval(this.interval);
                    this.interval = 0;
                    window.removeEventListener('error', this.onError);
                    if (audioContext)
                        audioContext.suspend();
                    this.stage.pauseExtensions();
                }
                this.isRunning = false;
            }
            resetInterval() {
                if (!this.isRunning) {
                    throw new Error('Cannot restart interval when paused');
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
            now() {
                return this.baseNow + Date.now() - this.baseTime;
            }
            resetTimer() {
                this.timerStart = this.now();
                this.whenTimerMSecs = 0;
            }
            evaluateExpression(sprite, fn) {
                self = this.stage;
                runtime = this;
                S = sprite;
                try {
                    return fn();
                }
                catch (e) {
                    return undefined;
                }
            }
            step() {
                self = this.stage;
                runtime = this;
                VISUAL = false;
                for (var i = 0; i < this.stage.children.length; i++) {
                    const c = this.stage.children[i];
                    if (c.isDragging) {
                        c.moveTo(c.dragOffsetX + c.stage.mouseX, c.dragOffsetY + c.stage.mouseY);
                    }
                }
                if (audioContext && audioContext.state === 'suspended') {
                    audioContext.resume();
                }
                const start = Date.now();
                this.currentMSecs = this.whenTimerMSecs = this.now();
                const queue = this.queue;
                do {
                    for (THREAD = 0; THREAD < queue.length; THREAD++) {
                        const thread = queue[THREAD];
                        if (thread) {
                            S = thread.sprite;
                            IMMEDIATE = thread.fn;
                            BASE = thread.base;
                            CALLS = thread.calls;
                            C = CALLS.pop();
                            STACK = C.stack;
                            R = STACK.pop();
                            queue[THREAD] = undefined;
                            WARP = thread.warp;
                            while (IMMEDIATE) {
                                const fn = IMMEDIATE;
                                IMMEDIATE = null;
                                fn();
                            }
                            STACK.push(R);
                            CALLS.push(C);
                        }
                    }
                    for (let i = queue.length; i--;) {
                        if (!queue[i]) {
                            queue.splice(i, 1);
                        }
                    }
                } while ((this.isTurbo || !VISUAL) && Date.now() - start < 1000 / this.framerate && queue.length);
                this.stage.updateExtensions();
                this.stage.draw();
            }
            onError(e) {
                clearInterval(this.interval);
                this.handleError(e.error);
            }
            handleError(e) {
                console.error(e);
            }
        }
        runtime_1.Runtime = Runtime;
        function createContinuation(source) {
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
        function scopedEval(source) {
            return eval(source);
        }
        runtime_1.scopedEval = scopedEval;
    })(runtime = P.runtime || (P.runtime = {}));
})(P || (P = {}));
var P;
(function (P) {
    var sb2;
    (function (sb2) {
        const ASSET_URL = 'https://cdn.assets.scratch.mit.edu/internalapi/asset/';
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
                        break;
                    case 'soundLevel':
                        if (this.stage.microphone) {
                            value = this.stage.microphone.getLoudness();
                        }
                        else {
                            value = -1;
                        }
                        break;
                    case 'tempo':
                        value = this.stage.tempoBPM;
                        break;
                    case 'timeAndDate':
                        value = this.timeAndDate(this.param);
                        break;
                    case 'timer':
                        value = Math.round((this.stage.runtime.now() - this.stage.runtime.timerStart) / 100) / 10;
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
                return ++this.sayId;
            }
            updateBubble() {
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
            _clone() {
                return new Scratch2Sprite(this.stage);
            }
        }
        sb2.Scratch2Sprite = Scratch2Sprite;
        class BaseSB2Loader extends P.io.Loader {
            loadImage(url) {
                return this.addTask(new P.io.Img(url)).load();
            }
            loadFonts() {
                return Promise.all([
                    this.addTask(new P.io.PromiseTask((P.utils.settled(P.fonts.loadWebFont('Donegal One'))))),
                    this.addTask(new P.io.PromiseTask((P.utils.settled(P.fonts.loadWebFont('Gloria Hallelujah'))))),
                    this.addTask(new P.io.PromiseTask((P.utils.settled(P.fonts.loadWebFont('Mystery Quest'))))),
                    this.addTask(new P.io.PromiseTask((P.utils.settled(P.fonts.loadWebFont('Permanent Marker'))))),
                ]).then(() => undefined);
            }
            loadBase(data, isStage) {
                var costumes;
                var sounds;
                return Promise.all([
                    this.loadArray(data.costumes, this.loadCostume.bind(this)).then((c) => costumes = c),
                    this.loadArray(data.sounds, this.loadSound.bind(this)).then((s) => sounds = s),
                ]).then(() => {
                    const object = new (isStage ? Scratch2Stage : Scratch2Sprite)(null);
                    if (data.variables) {
                        for (const variable of data.variables) {
                            if (variable.isPersistent) {
                                if (object.isStage) {
                                    object.cloudVariables.push(variable.name);
                                }
                                else {
                                    console.warn('Cloud variable found on a non-stage object. Skipping.');
                                }
                            }
                            object.vars[variable.name] = variable.value;
                        }
                    }
                    if (data.lists) {
                        for (const list of data.lists) {
                            if (list.isPersistent) {
                                console.warn('Cloud lists are not supported');
                            }
                            object.lists[list.listName] = list.contents;
                        }
                    }
                    object.name = data.objName;
                    object.costumes = costumes;
                    object.currentCostumeIndex = Math.floor(data.currentCostumeIndex);
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
                    object.scripts = data.scripts || [];
                    return object;
                });
            }
            loadArray(data, process) {
                return Promise.all((data || []).map((i, ind) => process(i, ind)));
            }
            loadObject(data) {
                if (data.cmd) {
                    return this.loadVariableWatcher(data);
                }
                else if (data.listName) {
                }
                else {
                    return this.loadBase(data, false);
                }
            }
            loadVariableWatcher(data) {
                const targetName = data.target;
                const watcher = new Scratch2VariableWatcher(null, targetName, data);
                return watcher;
            }
            loadCostume(data) {
                const promises = [
                    this.loadMD5(data.baseLayerMD5, data.baseLayerID)
                        .then((asset) => data.$image = asset)
                ];
                if (data.textLayerMD5) {
                    promises.push(this.loadMD5(data.textLayerMD5, data.textLayerID)
                        .then((asset) => data.$text = asset));
                }
                return Promise.all(promises)
                    .then((layers) => {
                    var image;
                    if (layers.length > 1) {
                        image = document.createElement('canvas');
                        const ctx = image.getContext('2d');
                        if (!ctx) {
                            throw new Error('Cannot get 2d rendering context loading costume ' + data.costumeName);
                        }
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
            loadSound(data) {
                return new Promise((resolve, reject) => {
                    this.loadMD5(data.md5, data.soundID, true)
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
            loadSVG(source) {
                const parser = new DOMParser();
                var doc = parser.parseFromString(source, 'image/svg+xml');
                var svg = doc.documentElement;
                if (!svg.style) {
                    doc = parser.parseFromString('<body>' + source, 'text/html');
                    svg = doc.querySelector('svg');
                }
                DOMPurify.sanitize(svg, {
                    IN_PLACE: true,
                    USE_PROFILES: { svg: true }
                });
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
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    throw new Error('unable to get rendering context for drawing svg');
                }
                return canvg.Canvg.from(ctx, new XMLSerializer().serializeToString(svg), {
                    ignoreMouse: true,
                    ignoreAnimation: true,
                    ignoreClear: true,
                })
                    .then((v) => {
                    return v.render();
                }).then(() => {
                    return canvas;
                });
            }
            load() {
                var children;
                var stage;
                return this.loadFonts()
                    .then(() => Promise.all([
                    P.audio.loadSoundbankSB2(this),
                    this.loadArray(this.projectData.children, this.loadObject.bind(this)).then((c) => children = c),
                    this.loadBase(this.projectData, true).then((s) => stage = s),
                ]))
                    .then(() => {
                    if (this.aborted) {
                        throw new Error('Loading aborting.');
                    }
                    children = children.filter((i) => i);
                    children.forEach((c) => c.stage = stage);
                    const sprites = children.filter((i) => i instanceof Scratch2Sprite);
                    const watchers = children.filter((i) => i instanceof Scratch2VariableWatcher);
                    stage.children = sprites;
                    stage.allWatchers = watchers;
                    stage.allWatchers.forEach((w) => w.init());
                    P.sb2.compiler.compile(stage);
                    return stage;
                });
            }
        }
        sb2.BaseSB2Loader = BaseSB2Loader;
        class SB2FileLoader extends BaseSB2Loader {
            constructor(buffer) {
                super();
                this.buffer = buffer;
            }
            loadMD5(hash, id, isAudio = false) {
                const f = isAudio ? (this.zip.file(id + '.wav') || this.zip.file(id + '.mp3')) : this.zip.file(id + '.gif') || (this.zip.file(id + '.png') || this.zip.file(id + '.jpg') || this.zip.file(id + '.svg'));
                if (!f) {
                    throw new Error('cannot find md5: ' + hash + ' (isAudio=' + isAudio + ')');
                }
                hash = f.name;
                if (isAudio) {
                    return f.async('arraybuffer')
                        .then((buffer) => P.audio.decodeAudio(buffer));
                }
                const ext = hash.split('.').pop();
                if (ext === 'svg') {
                    return f.async('text')
                        .then((text) => this.loadSVG(text));
                }
                else {
                    return new Promise((resolve, reject) => {
                        var image = new Image();
                        image.onload = function () {
                            resolve(image);
                        };
                        image.onerror = function () {
                            reject(new Error('Failed to load image: ' + hash + '/' + id));
                        };
                        f.async('binarystring')
                            .then((data) => {
                            image.src = 'data:image/' + (ext === 'jpg' ? 'jpeg' : ext) + ';base64,' + btoa(data);
                        });
                    });
                }
            }
            load() {
                return JSZip.loadAsync(this.buffer)
                    .then((data) => {
                    this.zip = data;
                    const project = this.zip.file('project.json');
                    if (!project) {
                        throw new Error('project.json is missing');
                    }
                    return project.async('text');
                })
                    .then((project) => {
                    this.projectData = P.json.parse(project);
                })
                    .then(() => super.load());
            }
        }
        sb2.SB2FileLoader = SB2FileLoader;
        class Scratch2Loader extends BaseSB2Loader {
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
            loadMD5(hash, id, isAudio = false) {
                const ext = hash.split('.').pop();
                if (ext === 'svg') {
                    return this.addTask(new P.io.Request(ASSET_URL + hash + '/get/')).load('text')
                        .then((text) => this.loadSVG(text));
                }
                else if (ext === 'wav') {
                    return this.addTask(new P.io.Request(ASSET_URL + hash + '/get/')).load('arraybuffer')
                        .then((buffer) => P.audio.decodeAudio(buffer));
                }
                else {
                    return this.loadImage(ASSET_URL + hash + '/get/');
                }
            }
            load() {
                if (this.projectId) {
                    return this.addTask(new P.io.Request(P.config.PROJECT_API.replace('$id', '' + this.projectId))).load('json')
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
        sb2.Scratch2Loader = Scratch2Loader;
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
                var transform = element.transform.baseVal.consolidate();
                if (transform) {
                    var x = 4 - .6 * transform.matrix.a;
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
            }
            else if ((element.hasAttribute('x') || element.hasAttribute('y')) && element.hasAttribute('transform')) {
                element.setAttribute('x', 0);
                element.setAttribute('y', 0);
            }
            [].forEach.call(element.childNodes, patchSVG.bind(null, svg));
        }
    })(sb2 = P.sb2 || (P.sb2 = {}));
})(P || (P = {}));
(function (P) {
    var sb2;
    (function (sb2) {
        var compiler;
        (function (compiler) {
            const CLOUD = '☁ ';
            var LOG_PRIMITIVES;
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
                'whenSensorGreaterThan'
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
                var isCloudVar = function (name) {
                    if (typeof name !== 'string') {
                        return false;
                    }
                    return name.startsWith(CLOUD) && object.stage.vars[name] !== undefined && object.stage.cloudVariables.indexOf(name) > -1;
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
                    else if (e[0] === 'answer') {
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
                    if (typeof e === 'number' || typeof e === 'boolean' || e === null) {
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
                    if (e[0] === 'xpos') {
                        return 'S.scratchX';
                    }
                    else if (e[0] === 'ypos') {
                        return 'S.scratchY';
                    }
                    else if (e[0] === 'heading') {
                        return 'S.direction';
                    }
                    else if (e[0] === 'costumeIndex') {
                        return '(S.currentCostumeIndex + 1)';
                    }
                    else if (e[0] === 'backgroundIndex') {
                        return '(self.currentCostumeIndex + 1)';
                    }
                    else if (e[0] === 'scale') {
                        return 'Math.round(S.scale * 100)';
                    }
                    else if (e[0] === 'volume') {
                        return '(S.volume * 100)';
                    }
                    else if (e[0] === 'tempo') {
                        return 'self.tempoBPM';
                    }
                    else if (e[0] === 'lineCountOfList:') {
                        return listRef(e[1]) + '.length';
                    }
                    else if (e[0] === '+') {
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
                                    return '(Math.asin(' + num(e[2]) + ') * 180 / Math.PI)';
                                case 'acos':
                                    return '(Math.acos(' + num(e[2]) + ') * 180 / Math.PI)';
                                case 'atan':
                                    return '(Math.atan(' + num(e[2]) + ') * 180 / Math.PI)';
                                case 'ln':
                                    return 'Math.log(' + num(e[2]) + ')';
                                case 'log':
                                    return '(Math.log(' + num(e[2]) + ') / Math.LN10)';
                                case 'e ^':
                                    return 'Math.exp(' + num(e[2]) + ')';
                                case '10 ^':
                                    return 'Math.exp(' + num(e[2]) + ' * Math.LN10)';
                            }
                            return '0';
                        }
                        return 'mathFunc(' + val(e[1]) + ', ' + num(e[2]) + ')';
                    }
                    else if (e[0] === 'mouseX') {
                        return 'self.mouseX';
                    }
                    else if (e[0] === 'mouseY') {
                        return 'self.mouseY';
                    }
                    else if (e[0] === 'timer') {
                        return '((runtime.now() - runtime.timerStart) / 1000)';
                    }
                    else if (e[0] === 'distanceTo:') {
                        return 'S.distanceTo(' + val(e[1]) + ')';
                    }
                    else if (e[0] === 'soundLevel') {
                        object.stage.initMicrophone();
                        return 'self.microphone.getLoudness()';
                    }
                    else if (e[0] === 'timestamp') {
                        return '((Date.now() - epoch) / 86400000)';
                    }
                    else if (e[0] === 'timeAndDate') {
                        return 'timeAndDate(' + val(e[1]) + ')';
                    }
                };
                var DIGIT = /\d/;
                var boolval = function (e) {
                    if (e[0] === 'list:contains:') {
                        return 'listContains(' + listRef(e[1]) + ', ' + val(e[2]) + ')';
                    }
                    else if (e[0] === '<' || e[0] === '>') {
                        var less;
                        let x;
                        let y;
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
                        let x;
                        let y;
                        if (typeof e[1] === 'string' && DIGIT.test(e[1]) || typeof e[1] === 'number') {
                            x = e[1];
                            y = e[2];
                        }
                        else if (typeof e[2] === 'string' && DIGIT.test(e[2]) || typeof e[2] === 'number') {
                            x = e[2];
                            y = e[1];
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
                    else if (e[0] === 'mousePressed') {
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
                    source += 'R.start = runtime.now();\n';
                    source += 'R.duration = ' + num(dur) + ' * 60 / self.tempoBPM;\n';
                    source += 'var first = true;\n';
                };
                var beatTail = function () {
                    var id = label();
                    source += 'if (!R.sound) R.sound = { stopped: false };';
                    source += 'S.activeSounds.add(R.sound);\n';
                    source += 'if ((runtime.now() - R.start < R.duration * 1000 || first) && !R.sound.stopped) {\n';
                    source += '  var first;\n';
                    forceQueue(id);
                    source += '}\n';
                    source += 'S.activeSounds.delete(R.sound);';
                    source += 'restore();\n';
                };
                var wait = function (dur) {
                    source += 'save();\n';
                    source += 'R.start = runtime.now();\n';
                    source += 'R.duration = ' + dur + ';\n';
                    source += 'var first = true;\n';
                    var id = label();
                    source += 'if (runtime.now() - R.start < R.duration * 1000 || first) {\n';
                    source += '  var first;\n';
                    forceQueue(id);
                    source += '}\n';
                    source += 'restore();\n';
                };
                var toHSLA = 'S.penColor.toHSLA();\n';
                toHSLA += 'S.penColor.a = 1;\n';
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
                    if (block[0] === 'forward:') {
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
                    else if (block[0] === 'lookLike:') {
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
                        source += 'R.start = runtime.now();\n';
                        source += 'R.duration = ' + num(block[2]) + ';\n';
                        var id = label();
                        source += 'if (runtime.now() - R.start < R.duration * 1000) {\n';
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
                        source += 'R.start = runtime.now();\n';
                        source += 'R.duration = ' + num(block[2]) + ';\n';
                        var id = label();
                        source += 'if (runtime.now() - R.start < R.duration * 1000) {\n';
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
                    }
                    else if (block[0] === 'setVideoState') {
                        source += 'switch (' + val(block[1]) + ') {';
                        source += '  case "off": self.showVideo(false); break;';
                        source += '  case "on": self.showVideo(true); break;';
                        source += '}';
                    }
                    else if (block[0] === 'playSound:') {
                        if (P.audio.context) {
                            source += 'var sound = S.getSound(' + val(block[1]) + ');\n';
                            source += 'if (sound) startSound(sound);\n';
                        }
                    }
                    else if (block[0] === 'doPlaySoundAndWait') {
                        if (P.audio.context) {
                            source += 'var sound = S.getSound(' + val(block[1]) + ');\n';
                            source += 'if (sound) {\n';
                            source += '  save();\n';
                            source += '  R.sound = playSound(sound);\n';
                            source += '  S.activeSounds.add(R.sound);\n';
                            source += '  R.start = runtime.now();\n';
                            source += '  R.duration = sound.duration;\n';
                            source += '  var first = true;\n';
                            var id = label();
                            source += '  if ((runtime.now() - R.start < R.duration * 1000 || first) && !R.sound.stopped) {\n';
                            source += '    var first;\n';
                            forceQueue(id);
                            source += '  }\n';
                            source += '  S.activeSounds.delete(R.sound);\n';
                            source += '  restore();\n';
                            source += '}\n';
                        }
                    }
                    else if (block[0] === 'stopAllSounds') {
                        if (P.audio.context) {
                            source += 'self.stopAllSounds();\n';
                        }
                    }
                    else if (block[0] === 'playDrum') {
                        beatHead(block[2]);
                        if (P.audio.context) {
                            source += 'R.sound = playSpan(DRUMS[Math.round(' + num(block[1]) + ') - 1] || DRUMS[2], 60, 10);\n';
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
                            source += 'R.sound = playNote(' + num(block[1]) + ', R.duration);\n';
                        }
                        beatTail();
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
                    else if (block[0] === 'clearPenTrails') {
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
                        source += 'S.penColor.setRGBA(' + num(block[1]) + ');\n';
                    }
                    else if (block[0] === 'setPenHueTo:') {
                        source += toHSLA;
                        source += 'S.penColor.x = ' + num(block[1]) + ' * 360 / 200;\n';
                        source += 'S.penColor.y = 100;\n';
                    }
                    else if (block[0] === 'changePenHueBy:') {
                        source += toHSLA;
                        source += 'S.penColor.x += ' + num(block[1]) + ' * 360 / 200;\n';
                        source += 'S.penColor.y = 100;\n';
                    }
                    else if (block[0] === 'setPenShadeTo:') {
                        source += toHSLA;
                        source += 'S.penColor.z = ' + num(block[1]) + ' % 200;\n';
                        source += 'if (S.penColor.z < 0) S.penColor.z += 200;\n';
                        source += 'S.penColor.y = 100;\n';
                    }
                    else if (block[0] === 'changePenShadeBy:') {
                        source += toHSLA;
                        source += 'S.penColor.z = (S.penColor.z + ' + num(block[1]) + ') % 200;\n';
                        source += 'if (S.penColor.z < 0) S.penColor.z += 200;\n';
                        source += 'S.penColor.y = 100;\n';
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
                    else if (block[0] === 'setVar:to:') {
                        source += varRef(block[1]) + ' = ' + val(block[2]) + ';\n';
                        if (isCloudVar(block[1])) {
                            source += 'cloudVariableChanged(' + val(block[1]) + ');\n';
                        }
                    }
                    else if (block[0] === 'changeVar:by:') {
                        var ref = varRef(block[1]);
                        source += ref + ' = (+' + ref + ' || 0) + ' + num(block[2]) + ';\n';
                        if (isCloudVar(block[1])) {
                            source += 'cloudVariableChanged(' + val(block[1]) + ');\n';
                        }
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
                        if (typeof block[1] === 'string') {
                            var o = object.vars[block[1]] !== undefined ? 'S' : 'self';
                            source += o + '.showVariable(' + val(block[1]) + ', ' + isShow + ');\n';
                        }
                        else {
                            warn('ignoring dynamic variable');
                        }
                    }
                    else if (block[0] === 'broadcast:') {
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
                        source += 'R.start = runtime.now();\n';
                        source += 'R.duration = ' + num(block[1]) + ';\n';
                        source += 'R.baseX = S.scratchX;\n';
                        source += 'R.baseY = S.scratchY;\n';
                        source += 'R.deltaX = ' + num(block[2]) + ' - S.scratchX;\n';
                        source += 'R.deltaY = ' + num(block[3]) + ' - S.scratchY;\n';
                        var id = label();
                        source += 'var f = (runtime.now() - R.start) / (R.duration * 1000);\n';
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
                        source += '    S.stopSoundsExcept(BASE);\n';
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
                    else if (block[0] === 'doAsk') {
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
                        source += 'runtime.timerStart = runtime.now();\n';
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
                    const key = P.runtime.getKeyCode(script[0][1]);
                    object.addWhenKeyPressedHandler(key, f);
                }
                else if (script[0][0] === 'whenSceneStarts') {
                    var key = script[0][1].toLowerCase();
                    (object.listeners.whenSceneStarts[key] || (object.listeners.whenSceneStarts[key] = [])).push(f);
                }
                else if (script[0][0] === 'procDef') {
                    const warp = script[0][4];
                    const name = script[0][1];
                    if (!object.procedures[name]) {
                        object.procedures[name] = new Scratch2Procedure(f, warp, inputs);
                    }
                    else {
                        warn('procedure already exists: ' + name);
                    }
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
var P;
(function (P) {
    var sb3;
    (function (sb3) {
        sb3.ASSETS_API = 'https://assets.scratch.mit.edu/internalapi/asset/$md5ext/get/';
        class Scratch3Stage extends P.core.Stage {
            constructor() {
                super(...arguments);
                this.listIds = {};
                this.varIds = {};
            }
        }
        sb3.Scratch3Stage = Scratch3Stage;
        class Scratch3Sprite extends P.core.Sprite {
            constructor() {
                super(...arguments);
                this.listIds = {};
                this.varIds = {};
            }
            _clone() {
                return new Scratch3Sprite(this.stage);
            }
        }
        sb3.Scratch3Sprite = Scratch3Sprite;
        class Scratch3VariableWatcher extends P.core.Watcher {
            constructor(stage, data) {
                super(stage, data.spriteName || '');
                this.id = data.id;
                this.opcode = data.opcode;
                this.mode = data.mode;
                this.params = data.params;
                this.libraryEntry = P.sb3.compiler.watcherLibrary[this.opcode];
                this.x = data.x;
                this.y = data.y;
                this.visible = typeof data.visible === 'boolean' ? data.visible : true;
                this.sliderMin = data.sliderMin || 0;
                this.sliderMax = data.sliderMax || 0;
                if (typeof data.isDiscrete !== 'undefined') {
                    this.sliderStep = data.isDiscrete ? 1 : 0.01;
                }
                else {
                    this.sliderStep = 1;
                }
                if (!this.libraryEntry) {
                    console.warn('unknown watcher', this.opcode, this);
                    this.valid = false;
                }
            }
            update() {
                if (this.visible) {
                    const value = this.getValue();
                    if (this.valueEl.textContent !== value) {
                        this.valueEl.textContent = value;
                    }
                    if (this.sliderInput) {
                        this.sliderInput.value = value;
                    }
                }
            }
            init() {
                super.init();
                if (this.libraryEntry.init) {
                    this.libraryEntry.init(this);
                }
                this.updateLayout();
            }
            setVisible(visible) {
                super.setVisible(visible);
                this.updateLayout();
            }
            getLabel() {
                const label = this.libraryEntry.getLabel(this);
                if (!this.target.isStage) {
                    return this.targetName + ': ' + label;
                }
                return label;
            }
            getValue() {
                const value = this.libraryEntry.evaluate(this);
                if (typeof value === 'number') {
                    return '' + (Math.round(value * 1e6) / 1e6);
                }
                return '' + value;
            }
            setValue(value) {
                if (this.libraryEntry.set) {
                    this.libraryEntry.set(this, value);
                    this.update();
                }
            }
            updateLayout() {
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
                container.onmousedown = (e) => e.stopPropagation();
                container.ontouchstart = (e) => e.stopPropagation();
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
                        this.sliderInput = input;
                        slider.appendChild(input);
                        container.appendChild(slider);
                    }
                }
            }
            sliderChanged(e) {
                const value = +e.target.value;
                this.setValue(value);
            }
        }
        sb3.Scratch3VariableWatcher = Scratch3VariableWatcher;
        class ListWatcherRow {
            constructor() {
                this.value = '';
                this.index = -1;
                this.y = 0;
                this.visible = true;
                this.element = document.createElement('div');
                this.indexEl = document.createElement('div');
                this.valueEl = document.createElement('div');
                this.element.className = 's3-list-row';
                this.indexEl.className = 's3-list-index';
                this.valueEl.className = 's3-list-value';
                this.element.appendChild(this.indexEl);
                this.element.appendChild(this.valueEl);
            }
            setValue(value) {
                if (value !== this.value) {
                    this.value = value;
                    this.valueEl.textContent = value;
                }
            }
            setIndex(index) {
                if (index !== this.index) {
                    this.index = index;
                    this.indexEl.textContent = (index + 1).toString();
                }
            }
            setY(y) {
                if (y !== this.y) {
                    this.y = y;
                    this.element.style.transform = 'translateY(' + y + 'px)';
                }
            }
            setVisible(visible) {
                if (this.visible !== visible) {
                    this.visible = visible;
                    this.element.style.display = visible ? '' : 'none';
                }
            }
        }
        sb3.ListWatcherRow = ListWatcherRow;
        class Scratch3ListWatcher extends P.core.Watcher {
            constructor(stage, data) {
                super(stage, data.spriteName || '');
                this.rows = [];
                this.firstUpdateComplete = false;
                this._rowHeight = -1;
                this.scrollTop = 0;
                this.lastZoomLevel = 1;
                this.scrollAhead = 8;
                this.scrollBack = 3;
                this.scrollDirection = 1;
                this._contentHeight = -1;
                this.id = data.id;
                this.params = data.params;
                this.x = data.x;
                this.y = data.y;
                this.visible = typeof data.visible === 'boolean' ? data.visible : true;
                this.width = data.width || 100;
                this.height = data.height || 200;
            }
            shouldUpdate() {
                if (!this.visible)
                    return false;
                if (this.lastZoomLevel !== this.stage.zoom)
                    return true;
                if (!this.firstUpdateComplete)
                    return true;
                return this.list.modified;
            }
            update() {
                if (!this.shouldUpdate()) {
                    return;
                }
                if (this.lastZoomLevel !== this.stage.zoom) {
                    this.contentEl.scrollTop *= this.stage.zoom / this.lastZoomLevel;
                }
                this.list.modified = false;
                this.lastZoomLevel = this.stage.zoom;
                this.firstUpdateComplete = true;
                this.updateList();
                const bottomLabelText = this.getBottomLabel();
                if (this.bottomLabelEl.textContent !== bottomLabelText) {
                    this.bottomLabelEl.textContent = this.getBottomLabel();
                }
            }
            updateList() {
                if (!this.visible && this._rowHeight === -1) {
                    return;
                }
                const height = this.list.length * this.getRowHeight() * this.stage.zoom;
                this.endpointEl.style.transform = 'translateY(' + height + 'px)';
                const topVisible = this.scrollTop;
                const bottomVisible = topVisible + this.getContentHeight();
                let startingIndex = Math.floor(topVisible / this.getRowHeight());
                let endingIndex = Math.ceil(bottomVisible / this.getRowHeight());
                if (this.scrollDirection === 1) {
                    startingIndex -= this.scrollBack;
                    endingIndex += this.scrollAhead;
                }
                else {
                    startingIndex -= this.scrollAhead;
                    endingIndex += this.scrollBack;
                }
                if (startingIndex < 0)
                    startingIndex = 0;
                if (endingIndex > this.list.length - 1)
                    endingIndex = this.list.length - 1;
                if (endingIndex - startingIndex > 50) {
                    endingIndex = startingIndex + 50;
                }
                const visibleRows = endingIndex - startingIndex;
                while (this.rows.length <= visibleRows) {
                    this.addRow();
                }
                for (var listIndex = startingIndex, rowIndex = 0; listIndex <= endingIndex; listIndex++, rowIndex++) {
                    let row = this.rows[rowIndex];
                    row.setIndex(listIndex);
                    row.setValue(this.list[listIndex]);
                    row.setY(listIndex * this._rowHeight * this.stage.zoom);
                    row.setVisible(true);
                }
                while (rowIndex < this.rows.length) {
                    this.rows[rowIndex].setVisible(false);
                    rowIndex++;
                }
            }
            init() {
                super.init();
                const target = this.target;
                const listId = this.id;
                const listName = target.listIds[listId];
                if (!(listName in this.target.lists)) {
                    this.target.lists[listName] = createList();
                }
                this.list = this.target.lists[listName];
                this.target.listWatchers[listName] = this;
                if (this.visible) {
                    this.updateLayout();
                }
            }
            getTopLabel() {
                if (this.target.isStage) {
                    return this.params.LIST;
                }
                return this.target.name + ': ' + this.params.LIST;
            }
            getBottomLabel() {
                return 'length ' + this.list.length;
            }
            getContentHeight() {
                if (this._contentHeight === -1) {
                    this._contentHeight = this.contentEl.offsetHeight;
                }
                return this._contentHeight;
            }
            getRowHeight() {
                if (this._rowHeight === -1) {
                    const PADDING = 2;
                    if (this.rows.length === 0) {
                        this.addRow();
                    }
                    const height = this.rows[0].element.offsetHeight / this.stage.zoom;
                    if (height === 0) {
                        return 0;
                    }
                    this._rowHeight = height + PADDING;
                }
                return this._rowHeight;
            }
            addRow() {
                const row = new ListWatcherRow();
                this.rows.push(row);
                this.contentEl.appendChild(row.element);
                return row;
            }
            updateLayout() {
                if (!this.containerEl) {
                    if (!this.visible) {
                        return;
                    }
                    this.createLayout();
                }
                this.containerEl.style.display = this.visible ? '' : 'none';
            }
            setVisible(visible) {
                super.setVisible(visible);
                this.updateLayout();
            }
            createLayout() {
                this.containerEl = document.createElement('div');
                this.topLabelEl = document.createElement('div');
                this.bottomLabelEl = document.createElement('div');
                this.middleContainerEl = document.createElement('div');
                this.contentEl = document.createElement('div');
                this.containerEl.style.top = (this.y / 10) + 'em';
                this.containerEl.style.left = (this.x / 10) + 'em';
                this.containerEl.style.height = (this.height / 10) + 'em';
                this.containerEl.style.width = (this.width / 10) + 'em';
                this.containerEl.classList.add('s3-list-container');
                this.containerEl.onmousedown = (e) => e.stopPropagation();
                this.containerEl.ontouchstart = (e) => e.stopPropagation();
                this.topLabelEl.textContent = this.getTopLabel();
                this.topLabelEl.classList.add('s3-list-top-label');
                this.bottomLabelEl.textContent = this.getBottomLabel();
                this.bottomLabelEl.classList.add('s3-list-bottom-label');
                this.middleContainerEl.classList.add('s3-list-content');
                this.contentEl.classList.add('s3-list-rows');
                this.contentEl.addEventListener('scroll', (e) => {
                    const scrollTop = this.contentEl.scrollTop / this.stage.zoom;
                    const scrollChange = this.scrollTop - scrollTop;
                    if (scrollChange < 0) {
                        this.scrollDirection = 1;
                    }
                    else if (scrollChange > 0) {
                        this.scrollDirection = 0;
                    }
                    this.scrollTop = scrollTop;
                    this.updateList();
                });
                this.endpointEl = document.createElement('div');
                this.endpointEl.className = 's3-list-endpoint';
                this.contentEl.appendChild(this.endpointEl);
                this.middleContainerEl.appendChild(this.contentEl);
                this.containerEl.appendChild(this.topLabelEl);
                this.containerEl.appendChild(this.middleContainerEl);
                this.containerEl.appendChild(this.bottomLabelEl);
                this.stage.ui.appendChild(this.containerEl);
            }
        }
        sb3.Scratch3ListWatcher = Scratch3ListWatcher;
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
        function createList() {
            const list = [];
            list.modified = false;
            list.toString = function () {
                var i = this.length;
                while (i--) {
                    if (('' + this[i]).length !== 1) {
                        return this.join(' ');
                    }
                }
                return this.join('');
            };
            return list;
        }
        sb3.createList = createList;
        const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
        function fixSVGNamespace(svg) {
            const newDocument = document.implementation.createHTMLDocument();
            const newSVG = newDocument.createElementNS(SVG_NAMESPACE, 'svg');
            for (const attribute of svg.attributes) {
                newSVG.setAttribute(attribute.name, attribute.value);
            }
            newSVG.innerHTML = svg.innerHTML;
            return newSVG;
        }
        function patchSVG(svg, costumeOptions) {
            const invalidNamespace = svg.namespaceURI !== SVG_NAMESPACE;
            if (invalidNamespace) {
                svg = fixSVGNamespace(svg);
                if (svg.firstElementChild && svg.firstElementChild.tagName !== 'g') {
                    const width = svg.width.baseVal;
                    const height = svg.height.baseVal;
                    if (width.unitType !== width.SVG_LENGTHTYPE_PERCENTAGE && height.unitType !== width.SVG_LENGTHTYPE_PERCENTAGE) {
                        const group = document.createElementNS(SVG_NAMESPACE, 'g');
                        const transform = svg.createSVGTransform();
                        for (const el of svg.children) {
                            group.appendChild(el);
                        }
                        transform.setTranslate(-width.value / 2, height.value / 2);
                        group.transform.baseVal.appendItem(transform);
                        costumeOptions.rotationCenterX -= width.value / 2;
                        costumeOptions.rotationCenterY += height.value / 2;
                        svg.appendChild(group);
                    }
                }
            }
            if (svg.hasAttribute('viewBox')) {
                const viewBox = svg.getAttribute('viewBox').split(/ |,/).map((i) => +i);
                if (viewBox.every((i) => !isNaN(i)) && viewBox.length === 4) {
                    const [x, y, w, h] = viewBox;
                    const width = Math.max(1, w + x);
                    const height = Math.max(1, h + y);
                    svg.setAttribute('width', width.toString());
                    svg.setAttribute('height', height.toString());
                }
                else {
                    console.warn('weird viewBox', svg.getAttribute('viewBox'));
                }
                svg.removeAttribute('viewBox');
            }
            const textElements = svg.querySelectorAll('text');
            const usedFonts = [];
            const addFont = (font) => {
                if (usedFonts.indexOf(font) === -1) {
                    usedFonts.push(font);
                }
            };
            for (var i = 0; i < textElements.length; i++) {
                const el = textElements[i];
                let fonts = (el.getAttribute('font-family') || '')
                    .split(',')
                    .map((i) => i.trim());
                let found = false;
                for (const family of fonts) {
                    if (P.fonts.scratch3[family]) {
                        found = true;
                        addFont(family);
                        break;
                    }
                    else if (family === 'sans-serif') {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    console.warn('unknown fonts', fonts);
                    const font = 'Sans Serif';
                    addFont(font);
                    el.setAttribute('font-family', font);
                }
            }
            P.fonts.addFontRules(svg, usedFonts);
            return svg;
        }
        class BaseSB3Loader extends P.io.Loader {
            constructor() {
                super(...arguments);
                this.needsMusic = false;
            }
            getSVG(path, costumeOptions) {
                return this.getAsText(path)
                    .then((source) => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(source, 'image/svg+xml');
                    const svg = patchSVG(doc.documentElement, costumeOptions);
                    return new Promise((resolve, reject) => {
                        const image = new Image();
                        image.onload = (e) => {
                            resolve(image);
                        };
                        image.onerror = (e) => {
                            reject(new Error('Failed to load SVG: ' + path));
                        };
                        image.src = 'data:image/svg+xml,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
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
                    return this.getSVG(path, costumeOptions)
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
                const target = new (data.isStage ? Scratch3Stage : Scratch3Sprite)(null);
                for (const id of Object.keys(data.variables)) {
                    const variable = data.variables[id];
                    const name = variable[0];
                    const value = variable[1];
                    if (variable.length > 2) {
                        const cloud = variable[2];
                        if (cloud) {
                            if (data.isStage) {
                                target.cloudVariables.push(name);
                            }
                            else {
                                console.warn('Cloud variable found on a non-stage object. Skipping.');
                            }
                        }
                    }
                    target.vars[name] = value;
                    target.varIds[id] = name;
                }
                for (const id of Object.keys(data.lists)) {
                    const list = data.lists[id];
                    const name = list[0];
                    const content = list[1];
                    if (target.lists[name]) {
                        continue;
                    }
                    const scratchList = createList();
                    for (var i = 0; i < content.length; i++) {
                        scratchList[i] = content[i];
                    }
                    target.lists[name] = scratchList;
                    target.listIds[id] = name;
                }
                target.name = data.name;
                target.currentCostumeIndex = data.currentCostume;
                if ('volume' in data) {
                    target.volume = data.volume / 100;
                }
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
            loadRequiredAssets() {
                return Promise.all([
                    this.loadFonts(),
                ]);
            }
            loadSoundbank() {
                return P.audio.loadSoundbankSB2(this);
            }
            loadFonts() {
                const promises = [];
                for (const family in P.fonts.scratch3) {
                    const promise = P.utils.settled(P.fonts.loadLocalFont(family, P.fonts.scratch3[family]));
                    promises.push(promise);
                    this.addTask(new P.io.PromiseTask(promise));
                }
                return Promise.all(promises);
            }
            compileTargets(targets, stage) {
                if (P.config.debug) {
                    console.time('Scratch 3 compile');
                }
                for (const target of targets) {
                    const compiler = new P.sb3.compiler.Compiler(target);
                    compiler.compile();
                    if (compiler.needsMusic) {
                        this.needsMusic = true;
                    }
                }
                if (P.config.debug) {
                    console.timeEnd('Scratch 3 compile');
                }
            }
            async load() {
                if (!this.projectData) {
                    throw new Error('Project data is missing or invalid');
                }
                if (!Array.isArray(this.projectData.targets)) {
                    throw new Error('Invalid project data: missing targets');
                }
                await this.loadRequiredAssets();
                this.resetTasks();
                const targets = await Promise.all(this.projectData.targets
                    .sort((a, b) => a.layerOrder - b.layerOrder)
                    .map((data) => this.loadTarget(data)));
                if (this.aborted) {
                    throw new Error('Loading aborting.');
                }
                const stage = targets.filter((i) => i.isStage)[0];
                if (!stage) {
                    throw new Error('Project does not have a Stage');
                }
                const sprites = targets.filter((i) => i.isSprite);
                sprites.forEach((sprite) => sprite.stage = stage);
                stage.children = sprites;
                if (this.projectData.monitors) {
                    stage.allWatchers = this.projectData.monitors
                        .map((data) => this.loadWatcher(data, stage))
                        .filter((i) => i && i.valid);
                    stage.allWatchers.forEach((watcher) => watcher.init());
                }
                this.compileTargets(targets, stage);
                if (this.needsMusic) {
                    await this.loadSoundbank();
                }
                this.projectData = null;
                return stage;
            }
        }
        sb3.BaseSB3Loader = BaseSB3Loader;
        class SB3FileLoader extends BaseSB3Loader {
            constructor(buffer) {
                super();
                this.buffer = buffer;
            }
            getAsText(path) {
                const task = this.addTask(new P.io.Manual());
                const file = this.zip.file(path);
                if (!file) {
                    throw new Error('cannot find file as text: ' + path);
                }
                return file.async('text')
                    .then((response) => {
                    task.markComplete();
                    return response;
                });
            }
            getAsArrayBuffer(path) {
                const task = this.addTask(new P.io.Manual());
                const file = this.zip.file(path);
                if (!file) {
                    throw new Error('cannot find file as arraybuffer: ' + path);
                }
                return file.async('arraybuffer')
                    .then((response) => {
                    task.markComplete();
                    return response;
                });
            }
            getAsBase64(path) {
                const task = this.addTask(new P.io.Manual());
                const file = this.zip.file(path);
                if (!file) {
                    throw new Error('cannot find file as base64: ' + path);
                }
                return file.async('base64')
                    .then((response) => {
                    task.markComplete();
                    return response;
                });
            }
            getAsImage(path, format) {
                const task = this.addTask(new P.io.Manual());
                return this.getAsBase64(path)
                    .then((imageData) => {
                    return new Promise((resolve, reject) => {
                        const image = new Image();
                        image.onload = () => {
                            task.markComplete();
                            resolve(image);
                        };
                        image.onerror = (error) => {
                            reject(new Error('Failed to load image: ' + path + '.' + format));
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
                return this.addTask(new P.io.Request(sb3.ASSETS_API.replace('$md5ext', path))).load('text');
            }
            getAsArrayBuffer(path) {
                return this.addTask(new P.io.Request(sb3.ASSETS_API.replace('$md5ext', path))).load('arraybuffer');
            }
            getAsImage(path) {
                return this.addTask(new P.io.Img(sb3.ASSETS_API.replace('$md5ext', path))).load();
            }
            load() {
                if (this.projectId) {
                    return this.addTask(new P.io.Request(P.config.PROJECT_API.replace('$id', '' + this.projectId))).load('json')
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
(function (P) {
    var sb3;
    (function (sb3) {
        var compiler;
        (function (compiler_1) {
            function assertNever(i) {
                throw new Error('Compile-time assertNever failed.');
            }
            class CompiledInput {
                constructor(source, type) {
                    this.source = source;
                    this.type = type;
                    this.potentialNumber = true;
                    this.flags = 0;
                }
                enableFlag(flag) {
                    this.flags |= flag;
                }
                hasFlag(flag) {
                    return (this.flags & flag) !== 0;
                }
                toString() {
                    return this.source;
                }
            }
            compiler_1.CompiledInput = CompiledInput;
            const stringInput = (v) => new CompiledInput(v, 'string');
            const numberInput = (v) => new CompiledInput(v, 'number');
            const booleanInput = (v) => new CompiledInput(v, 'boolean');
            const anyInput = (v) => new CompiledInput(v, 'any');
            ;
            class BlockUtil {
                constructor(compiler, block) {
                    this.compiler = compiler;
                    this.block = block;
                }
                get target() {
                    return this.compiler.target;
                }
                get stage() {
                    return this.compiler.target.stage;
                }
                getInput(name, type) {
                    return this.compiler.compileInput(this.block, name, type);
                }
                getField(name) {
                    return this.compiler.getField(this.block, name);
                }
                fieldInput(name) {
                    return this.sanitizedInput(this.getField(name));
                }
                sanitizedInput(string) {
                    return this.compiler.sanitizedInput(string);
                }
                sanitizedString(string) {
                    return this.compiler.sanitizedString(string);
                }
                getVariableReference(field) {
                    return this.compiler.getVariableReference(this.compiler.getVariableField(this.block, field));
                }
                getListReference(field) {
                    return this.compiler.getListReference(this.compiler.getVariableField(this.block, field));
                }
                getVariableScope(field) {
                    return this.compiler.findVariable(this.compiler.getVariableField(this.block, field)).scope;
                }
                isCloudVariable(field) {
                    return this.target.stage.cloudVariables.indexOf(this.getField(field)) > -1;
                }
                getListScope(field) {
                    return this.compiler.findList(this.compiler.getVariableField(this.block, field)).scope;
                }
                asType(input, type) {
                    return this.compiler.asType(input, type);
                }
                evaluateInputOnce(input) {
                    const fn = P.runtime.scopedEval(`(function() { return ${input}; })`);
                    return this.target.stage.runtime.evaluateExpression(this.target, fn);
                }
            }
            compiler_1.BlockUtil = BlockUtil;
            class StatementUtil extends BlockUtil {
                constructor() {
                    super(...arguments);
                    this.content = '';
                    this.substacksQueue = false;
                }
                getSubstack(name) {
                    const labelsBefore = this.compiler.labelCount;
                    const substack = this.compiler.compileSubstackInput(this.block, name);
                    if (this.compiler.labelCount !== labelsBefore) {
                        this.substacksQueue = true;
                    }
                    return substack;
                }
                claimNextLabel() {
                    return this.compiler.labelCount++;
                }
                addLabel(label) {
                    if (!label) {
                        label = this.claimNextLabel();
                    }
                    this.write(`{{${label}}}`);
                    return label;
                }
                queue(label) {
                    this.writeLn(`queue(${label}); return;`);
                }
                forceQueue(label) {
                    this.writeLn(`forceQueue(${label}); return;`);
                }
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
                updateBubble() {
                    this.writeLn('if (S.saying) S.updateBubble()');
                }
                waitUntilSettles(source) {
                    this.writeLn('save();');
                    this.writeLn('R.resume = false;');
                    this.writeLn('var localR = R;');
                    this.writeLn(`${source}`);
                    this.writeLn('  .then(function() { localR.resume = true; })');
                    this.writeLn('  .catch(function() { localR.resume = true; });');
                    const label = this.addLabel();
                    this.writeLn('if (!R.resume) {');
                    this.forceQueue(label);
                    this.writeLn('}');
                    this.writeLn('restore();');
                }
                waitOneTick() {
                    this.writeLn('save();');
                    this.writeLn('R.start = runtime.currentMSecs;');
                    const label = this.addLabel();
                    this.writeLn('if (runtime.currentMSecs === R.start) {');
                    this.forceQueue(label);
                    this.writeLn('}');
                    this.writeLn('restore();');
                }
                write(content) {
                    this.content += content;
                }
                writeLn(content) {
                    this.content += content + '\n';
                }
            }
            compiler_1.StatementUtil = StatementUtil;
            class InputUtil extends BlockUtil {
                numberInput(v) { return numberInput(v); }
                stringInput(v) { return stringInput(v); }
                booleanInput(v) { return booleanInput(v); }
                anyInput(v) { return anyInput(v); }
            }
            compiler_1.InputUtil = InputUtil;
            class HatUtil extends BlockUtil {
                constructor(compiler, block, startingFunction) {
                    super(compiler, block);
                    this.startingFunction = startingFunction;
                }
            }
            compiler_1.HatUtil = HatUtil;
            compiler_1.statementLibrary = Object.create(null);
            compiler_1.inputLibrary = Object.create(null);
            compiler_1.hatLibrary = Object.create(null);
            compiler_1.watcherLibrary = Object.create(null);
            const safeNumberToString = (n) => {
                if (Object.is(n, -0)) {
                    return '-0';
                }
                return n.toString();
            };
            class Compiler {
                constructor(target) {
                    this.labelCount = 0;
                    this.needsMusic = false;
                    this.costumeAndSoundNames = new Set();
                    this.target = target;
                    this.data = target.sb3data;
                    this.blocks = this.data.blocks;
                    for (const costume of target.costumes) {
                        this.costumeAndSoundNames.add(costume.name);
                    }
                    for (const sound of target.sounds) {
                        this.costumeAndSoundNames.add(sound.name);
                    }
                }
                getHatBlocks() {
                    return Object.keys(this.blocks)
                        .filter((i) => this.blocks[i].topLevel);
                }
                getStatementCompiler(opcode) {
                    if (compiler_1.statementLibrary[opcode]) {
                        return compiler_1.statementLibrary[opcode];
                    }
                    return null;
                }
                getInputCompiler(opcode) {
                    if (compiler_1.inputLibrary[opcode]) {
                        return compiler_1.inputLibrary[opcode];
                    }
                    return null;
                }
                getHatCompiler(opcode) {
                    if (compiler_1.hatLibrary[opcode]) {
                        return compiler_1.hatLibrary[opcode];
                    }
                    return null;
                }
                getInputFallback(type) {
                    switch (type) {
                        case 'number': return '0';
                        case 'boolean': return 'false';
                        case 'string': return '""';
                        case 'any': return '""';
                        case 'list': return '""';
                        case 'color': return '0';
                    }
                    assertNever(type);
                }
                asType(input, type) {
                    switch (type) {
                        case 'string': return '("" + ' + input + ')';
                        case 'number': return '(+' + input + ' || 0)';
                        case 'boolean': return 'bool(' + input + ')';
                        case 'any': return input;
                        case 'list': throw new Error("Converting to 'list' type is not something you're supposed to do");
                        case 'color': return 'parseColor(' + input + ')';
                    }
                    assertNever(type);
                }
                convertInputType(input, type) {
                    if (input.type === type) {
                        if (type === 'number' && input.hasFlag(1)) {
                            return new CompiledInput('(' + input.source + ' || 0)', type);
                        }
                        return input;
                    }
                    if (type === 'any') {
                        if (input.type === 'list') {
                            type = 'string';
                        }
                        else {
                            return input;
                        }
                    }
                    return new CompiledInput(this.asType(input.source, type), type);
                }
                sanitizedInput(string) {
                    return stringInput(this.sanitizedString(string));
                }
                sanitizedString(string) {
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
                sanitizedComment(content) {
                    content = content
                        .replace(/\*\//g, '');
                    return `/* ${content} */`;
                }
                findVariable(id) {
                    const stage = this.target.stage;
                    if (stage.varIds.hasOwnProperty(id)) {
                        return { scope: 'self', name: stage.varIds[id] };
                    }
                    else if (this.target.varIds.hasOwnProperty(id)) {
                        return { scope: 'S', name: this.target.varIds[id] };
                    }
                    else {
                        this.target.vars[id] = 0;
                        this.target.varIds[id] = id;
                        return { scope: 'S', name: id };
                    }
                }
                findList(id) {
                    const stage = this.target.stage;
                    if (stage.listIds.hasOwnProperty(id)) {
                        return { scope: 'self', name: stage.listIds[id] };
                    }
                    else if (this.target.listIds.hasOwnProperty(id)) {
                        return { scope: 'S', name: this.target.listIds[id] };
                    }
                    else {
                        this.target.lists[id] = sb3.createList();
                        this.target.listIds[id] = id;
                        return { scope: 'S', name: id };
                    }
                }
                getVariableReference(id) {
                    const { scope, name } = this.findVariable(id);
                    return `${scope}.vars[${this.sanitizedString(name)}]`;
                }
                getListReference(id) {
                    const { scope, name } = this.findList(id);
                    return `${scope}.lists[${this.sanitizedString(name)}]`;
                }
                isStringLiteralPotentialNumber(text) {
                    return /\d|true|false|Infinity/.test(text);
                }
                isNameOfCostumeOrSound(text) {
                    return this.costumeAndSoundNames.has(text);
                }
                compileNativeInput(native, desiredType) {
                    const type = native[0];
                    switch (type) {
                        case 4:
                        case 5:
                        case 6:
                        case 7:
                        case 8: {
                            const number = +native[1];
                            if (isNaN(number) || desiredType === 'string') {
                                return this.sanitizedInput('' + native[1]);
                            }
                            return numberInput(safeNumberToString(number));
                        }
                        case 10: {
                            const value = native[1];
                            if (desiredType !== 'string' && /\d|Infinity/.test(value) && !this.isNameOfCostumeOrSound(value)) {
                                const number = +value;
                                if (number.toString() === value) {
                                    if (!isNaN(number)) {
                                        return numberInput(number.toString());
                                    }
                                }
                            }
                            const input = this.sanitizedInput(native[1] + '');
                            input.potentialNumber = this.isStringLiteralPotentialNumber(native[1]);
                            return input;
                        }
                        case 12:
                            return anyInput(this.getVariableReference(native[2]));
                        case 13:
                            return new CompiledInput(this.getListReference(native[2]), 'list');
                        case 11:
                            return this.sanitizedInput(native[1]);
                        case 9: {
                            const color = native[1];
                            const rgb = P.utils.parseColor(color);
                            return new CompiledInput('' + rgb, 'color');
                        }
                        default:
                            this.warn('unknown native', type, native);
                            return stringInput('""');
                    }
                }
                compileInput(parentBlock, inputName, type) {
                    if (!parentBlock.inputs || !parentBlock.inputs[inputName]) {
                        this.warn('missing input', inputName);
                        return new CompiledInput(this.getInputFallback(type), type);
                    }
                    const input = parentBlock.inputs[inputName];
                    if (Array.isArray(input[1])) {
                        const native = input[1];
                        return this.convertInputType(this.compileNativeInput(native, type), type);
                    }
                    const inputBlockId = input[1];
                    if (!inputBlockId) {
                        return new CompiledInput(this.getInputFallback(type), type);
                    }
                    const inputBlock = this.blocks[inputBlockId];
                    if (!inputBlock) {
                        return new CompiledInput(this.getInputFallback(type), type);
                    }
                    const opcode = inputBlock.opcode;
                    const compiler = this.getInputCompiler(opcode);
                    if (!compiler) {
                        this.warn('unknown input', opcode, inputBlock);
                        return new CompiledInput(this.getInputFallback(type), type);
                    }
                    const util = new InputUtil(this, inputBlock);
                    let result = compiler(util);
                    if (P.config.debug) {
                        result.source = this.sanitizedComment(inputBlock.opcode) + result.source;
                    }
                    return this.convertInputType(result, type);
                }
                getField(block, fieldName) {
                    const value = block.fields[fieldName];
                    if (!value) {
                        this.warn('missing field', fieldName);
                        return '';
                    }
                    return '' + value[0];
                }
                getVariableField(block, fieldName) {
                    const value = block.fields[fieldName];
                    if (!value) {
                        this.warn('missing variable field', fieldName);
                        return '';
                    }
                    return '' + value[1];
                }
                compileSubstackInput(block, substackName) {
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
                getNewState() {
                    return {
                        isWarp: false,
                        isProcedure: false,
                        argumentNames: []
                    };
                }
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
                compileHat(hat) {
                    const hatCompiler = this.getHatCompiler(hat.opcode);
                    if (!hatCompiler) {
                        if (!this.getInputCompiler(hat.opcode) && !this.getStatementCompiler(hat.opcode)) {
                            this.warn('unknown hat block', hat.opcode, hat);
                        }
                        return;
                    }
                    this.labelCount = this.target.fns.length;
                    const startingBlock = hat.next;
                    if (!startingBlock) {
                        return;
                    }
                    this.state = this.getNewState();
                    let script = `{{${this.labelCount++}}}`;
                    if (hatCompiler.precompile) {
                        script += hatCompiler.precompile(this, hat);
                    }
                    script += this.compileStack(startingBlock);
                    if (hatCompiler.postcompile) {
                        script = hatCompiler.postcompile(this, script, hat);
                    }
                    const parseResult = this.parseScript(script);
                    const parsedScript = parseResult.script;
                    const startFn = this.target.fns.length;
                    for (let label of Object.keys(parseResult.labels)) {
                        this.target.fns[label] = P.runtime.createContinuation(parsedScript.slice(parseResult.labels[label]));
                    }
                    const startingFunction = this.target.fns[startFn];
                    const util = new HatUtil(this, hat, startingFunction);
                    hatCompiler.handle(util);
                    if (P.config.debug) {
                        this.log(`[${this.target.name}] compiled sb3 script "${hat.opcode}"`, script, this.target);
                    }
                }
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
                    const fixedScript = script.replace(/{{\d+}}/g, '');
                    return {
                        labels,
                        script: fixedScript,
                    };
                }
                warn(...args) {
                    args.unshift(`[sb3 compiler ${this.target.name}]`);
                    console.warn.apply(console, args);
                }
                log(...args) {
                    args.unshift(`[sb3 compiler ${this.target.name}]`);
                    console.log.apply(console, args);
                }
                compile() {
                    const hats = this.getHatBlocks();
                    for (const hatId of hats) {
                        const hat = this.blocks[hatId];
                        this.compileHat(hat);
                    }
                    this.target.sb3data = null;
                }
            }
            compiler_1.Compiler = Compiler;
        })(compiler = sb3.compiler || (sb3.compiler = {}));
    })(sb3 = P.sb3 || (P.sb3 = {}));
})(P || (P = {}));
(function () {
    const statementLibrary = P.sb3.compiler.statementLibrary;
    const inputLibrary = P.sb3.compiler.inputLibrary;
    const hatLibrary = P.sb3.compiler.hatLibrary;
    const watcherLibrary = P.sb3.compiler.watcherLibrary;
    statementLibrary['control_all_at_once'] = function (util) {
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
        util.writeLn('if (S.isClone) {');
        util.visual('visible');
        util.writeLn('  S.remove();');
        util.writeLn('  var i = self.children.indexOf(S);');
        util.writeLn('  if (i !== -1) self.children.splice(i, 1);');
        util.writeLn('  for (var i = 0; i < runtime.queue.length; i++) {');
        util.writeLn('    if (runtime.queue[i] && runtime.queue[i].sprite === S) {');
        util.writeLn('      runtime.queue[i] = undefined;');
        util.writeLn('    }');
        util.writeLn('  }');
        util.writeLn('  return;');
        util.writeLn('}');
    };
    statementLibrary['control_for_each'] = function (util) {
        const VARIABLE = util.getVariableReference('VARIABLE');
        const SUBSTACK = util.getSubstack('SUBSTACK');
        const VALUE = util.getInput('VALUE', 'number');
        util.writeLn('save();');
        util.writeLn(`R.times = ${VALUE};`);
        util.writeLn('R.current = 0;');
        const label = util.addLabel();
        util.writeLn(`if (R.current < R.times) {`);
        util.writeLn(`  ${VARIABLE} = ++R.current;`);
        util.write(SUBSTACK);
        util.queue(label);
        util.writeLn('} else {');
        util.writeLn('  restore();');
        util.writeLn('}');
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
        const CONDITION = util.getInput('CONDITION', 'boolean');
        const SUBSTACK = util.getSubstack('SUBSTACK');
        util.writeLn(`if (${CONDITION}) {`);
        util.write(SUBSTACK);
        util.writeLn('}');
    };
    statementLibrary['control_if_else'] = function (util) {
        const CONDITION = util.getInput('CONDITION', 'boolean');
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
                util.writeLn('S.stopSoundsExcept(BASE);');
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
        util.visual('always');
        util.writeLn('save();');
        util.writeLn('R.start = runtime.currentMSecs;');
        util.writeLn(`R.duration = ${DURATION};`);
        util.writeLn(`var first = true;`);
        const label = util.addLabel();
        util.writeLn('if (runtime.currentMSecs - R.start < R.duration * 1000 || first) {');
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
        util.writeLn(`watchedAppendToList(${LIST}, ${ITEM});`);
    };
    statementLibrary['data_changevariableby'] = function (util) {
        const VARIABLE = util.getVariableReference('VARIABLE');
        const VALUE = util.getInput('VALUE', 'number');
        util.writeLn(`${VARIABLE} = (${util.asType(VARIABLE, 'number')} + ${VALUE});`);
        if (util.isCloudVariable('VARIABLE')) {
            util.writeLn(`cloudVariableChanged(${util.sanitizedString(util.getField('VARIABLE'))})`);
        }
    };
    statementLibrary['data_deletealloflist'] = function (util) {
        const LIST = util.getListReference('LIST');
        util.writeLn(`watchedDeleteAllOfList(${LIST});`);
    };
    statementLibrary['data_deleteoflist'] = function (util) {
        const LIST = util.getListReference('LIST');
        const INDEX = util.getInput('INDEX', 'any');
        util.writeLn(`watchedDeleteLineOfList(${LIST}, ${INDEX});`);
    };
    statementLibrary['data_hidelist'] = function (util) {
        const LIST = util.sanitizedString(util.getField('LIST'));
        const scope = util.getListScope('LIST');
        util.writeLn(`${scope}.showList(${LIST}, false);`);
    };
    statementLibrary['data_hidevariable'] = function (util) {
        const VARIABLE = util.sanitizedString(util.getField('VARIABLE'));
        const scope = util.getVariableScope('VARIABLE');
        util.writeLn(`${scope}.showVariable(${VARIABLE}, false);`);
    };
    statementLibrary['data_insertatlist'] = function (util) {
        const LIST = util.getListReference('LIST');
        const INDEX = util.getInput('INDEX', 'any');
        const ITEM = util.getInput('ITEM', 'any');
        util.writeLn(`watchedInsertInList(${LIST}, ${INDEX}, ${ITEM});`);
    };
    statementLibrary['data_replaceitemoflist'] = function (util) {
        const LIST = util.getListReference('LIST');
        const ITEM = util.getInput('ITEM', 'any');
        const INDEX = util.getInput('INDEX', 'any');
        util.writeLn(`watchedSetLineOfList(${LIST}, ${INDEX}, ${ITEM});`);
    };
    statementLibrary['data_setvariableto'] = function (util) {
        const VARIABLE = util.getVariableReference('VARIABLE');
        const VALUE = util.getInput('VALUE', 'any');
        util.writeLn(`${VARIABLE} = ${VALUE};`);
        if (util.isCloudVariable('VARIABLE')) {
            util.writeLn(`cloudVariableChanged(${util.sanitizedString(util.getField('VARIABLE'))})`);
        }
    };
    statementLibrary['data_showlist'] = function (util) {
        const LIST = util.sanitizedString(util.getField('LIST'));
        const scope = util.getListScope('LIST');
        util.writeLn(`${scope}.showList(${LIST}, true);`);
    };
    statementLibrary['data_showvariable'] = function (util) {
        const VARIABLE = util.sanitizedString(util.getField('VARIABLE'));
        const scope = util.getVariableScope('VARIABLE');
        util.writeLn(`${scope}.showVariable(${VARIABLE}, true);`);
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
            util.writeLn(`  self.children.splice(Math.max(0, Math.min(self.children.length - 1, i + ${NUM})), 0, S);`);
        }
        else {
            util.writeLn(`  self.children.splice(Math.max(0, Math.min(self.children.length - 1, i - ${NUM})), 0, S);`);
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
        util.writeLn('S.visible = false;');
        util.updateBubble();
    };
    statementLibrary['looks_nextbackdrop'] = function (util) {
        util.writeLn('self.showNextCostume();');
        util.visual('always');
        util.writeLn('var threads = sceneChange();');
        util.writeLn('if (threads.indexOf(BASE) !== -1) {return;}');
    };
    statementLibrary['looks_nextcostume'] = function (util) {
        util.writeLn('S.showNextCostume();');
        util.visual('visible');
    };
    statementLibrary['looks_say'] = function (util) {
        const MESSAGE = util.getInput('MESSAGE', 'any');
        util.writeLn(`S.say(${MESSAGE}, false);`);
        util.visual('visible');
    };
    statementLibrary['looks_sayforsecs'] = function (util) {
        const MESSAGE = util.getInput('MESSAGE', 'any');
        const SECS = util.getInput('SECS', 'number');
        util.writeLn('save();');
        util.writeLn(`R.id = S.say(${MESSAGE}, false);`);
        util.visual('visible');
        util.writeLn('R.start = runtime.now();');
        util.writeLn(`R.duration = ${SECS};`);
        const label = util.addLabel();
        util.writeLn('if (runtime.now() - R.start < R.duration * 1000) {');
        util.forceQueue(label);
        util.writeLn('}');
        util.writeLn('if (S.sayId === R.id) {');
        util.writeLn('  S.say("");');
        util.writeLn('}');
        util.writeLn('restore();');
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
        util.writeLn('var threads = sceneChange();');
        util.writeLn('if (threads.indexOf(BASE) !== -1) {return;}');
    };
    statementLibrary['looks_switchbackdroptoandwait'] = function (util) {
        const BACKDROP = util.getInput('BACKDROP', 'any');
        util.writeLn(`self.setCostume(${BACKDROP});`);
        util.visual('always');
        util.writeLn('save();');
        util.writeLn('R.threads = sceneChange();');
        util.writeLn('if (R.threads.indexOf(BASE) !== -1) {return;}');
        const label = util.addLabel();
        util.writeLn('if (running(R.threads)) {');
        util.forceQueue(label);
        util.writeLn('}');
        util.writeLn('restore();');
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
        util.visual('visible');
        util.writeLn('R.start = runtime.now();');
        util.writeLn(`R.duration = ${SECS};`);
        const label = util.addLabel();
        util.writeLn('if (runtime.now() - R.start < R.duration * 1000) {');
        util.forceQueue(label);
        util.writeLn('}');
        util.writeLn('if (S.sayId === R.id) {');
        util.writeLn('  S.say("");');
        util.writeLn('}');
        util.writeLn('restore();');
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
        util.writeLn('R.start = runtime.now();');
        util.writeLn(`R.duration = ${SECS};`);
        util.writeLn('R.baseX = S.scratchX;');
        util.writeLn('R.baseY = S.scratchY;');
        util.writeLn(`R.deltaX = ${X} - S.scratchX;`);
        util.writeLn(`R.deltaY = ${Y} - S.scratchY;`);
        const label = util.addLabel();
        util.writeLn('var f = (runtime.now() - R.start) / (R.duration * 1000);');
        util.writeLn('if (f > 1 || isNaN(f)) f = 1;');
        util.writeLn('S.moveTo(R.baseX + f * R.deltaX, R.baseY + f * R.deltaY);');
        util.visual('drawing');
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
        util.writeLn('R.start = runtime.now();');
        util.writeLn(`R.duration = ${SECS};`);
        util.writeLn('R.baseX = S.scratchX;');
        util.writeLn('R.baseY = S.scratchY;');
        util.writeLn(`var to = self.getPosition(${TO});`);
        util.writeLn('if (to) {');
        util.writeLn('  R.deltaX = to.x - S.scratchX;');
        util.writeLn('  R.deltaY = to.y - S.scratchY;');
        const label = util.addLabel();
        util.writeLn('  var f = (runtime.now() - R.start) / (R.duration * 1000);');
        util.writeLn('  if (f > 1 || isNaN(f)) f = 1;');
        util.writeLn('  S.moveTo(R.baseX + f * R.deltaX, R.baseY + f * R.deltaY);');
        util.visual('drawing');
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
        util.writeLn(`S.setDirection(${DIRECTION});`);
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
    statementLibrary['motion_turnright'] = function (util) {
        const DEGREES = util.getInput('DEGREES', 'number');
        util.writeLn(`S.setDirection(S.direction + ${DEGREES});`);
        util.visual('visible');
    };
    statementLibrary['music_changeTempo'] = function (util) {
        const TEMPO = util.getInput('TEMPO', 'number');
        util.writeLn(`self.tempoBPM += ${TEMPO};`);
    };
    statementLibrary['music_playDrumForBeats'] = function (util) {
        const BEATS = util.getInput('BEATS', 'number');
        const DRUM = util.getInput('DRUM', 'number');
        util.compiler.needsMusic = true;
        util.writeLn('save();');
        util.writeLn('R.start = runtime.now();');
        util.writeLn(`R.duration = ${BEATS} * 60 / self.tempoBPM;`);
        util.writeLn(`var first = true;`);
        if (P.audio.context) {
            util.writeLn(`R.sound = playSpan(DRUMS[Math.round(${DRUM}) - 1] || DRUMS[2], 60, 10);`);
        }
        else {
            util.writeLn('R.sound = { stopped: false };');
        }
        const id = util.addLabel();
        util.writeLn('S.activeSounds.add(R.sound);');
        util.writeLn('if ((runtime.now() - R.start < R.duration * 1000 || first) && !R.sound.stopped) {');
        util.writeLn('  var first;');
        util.forceQueue(id);
        util.writeLn('}');
        util.writeLn('S.activeSounds.delete(R.sound);');
        util.writeLn('restore();');
    };
    statementLibrary['music_playNoteForBeats'] = function (util) {
        const BEATS = util.getInput('BEATS', 'number');
        const NOTE = util.getInput('NOTE', 'number');
        util.compiler.needsMusic = true;
        util.writeLn('save();');
        util.writeLn('R.start = runtime.now();');
        util.writeLn(`R.duration = ${BEATS} * 60 / self.tempoBPM;`);
        util.writeLn(`var first = true;`);
        if (P.audio.context) {
            util.writeLn(`R.sound = playNote(${NOTE}, R.duration);`);
        }
        else {
            util.writeLn('R.sound = { stopped: false };');
        }
        const id = util.addLabel();
        util.writeLn('S.activeSounds.add(R.sound);');
        util.writeLn('if ((runtime.now() - R.start < R.duration * 1000 || first) && !R.sound.stopped) {');
        util.writeLn('  var first;');
        util.forceQueue(id);
        util.writeLn('}');
        util.writeLn('S.activeSounds.delete(R.sound);');
        util.writeLn('restore();');
    };
    statementLibrary['music_restForBeats'] = function (util) {
        const BEATS = util.getInput('BEATS', 'number');
        util.writeLn('save();');
        util.writeLn('R.start = runtime.now();');
        util.writeLn(`R.duration = ${BEATS} * 60 / self.tempoBPM;`);
        util.writeLn(`var first = true;`);
        const id = util.addLabel();
        util.writeLn('if (runtime.now() - R.start < R.duration * 1000 || first) {');
        util.writeLn('  var first;');
        util.forceQueue(id);
        util.writeLn('}');
        util.writeLn('restore();');
    };
    statementLibrary['music_setTempo'] = function (util) {
        const TEMPO = util.getInput('TEMPO', 'number');
        util.writeLn(`self.tempoBPM = ${TEMPO};`);
    };
    statementLibrary['music_setInstrument'] = function (util) {
        const INSTRUMENT = util.getInput('INSTRUMENT', 'number');
        util.writeLn(`S.instrument = Math.max(0, Math.min(INSTRUMENTS.length - 1, ${INSTRUMENT} - 1)) | 0;`);
    };
    statementLibrary['pen_changePenColorParamBy'] = function (util) {
        const COLOR_PARAM = util.getInput('COLOR_PARAM', 'string');
        const VALUE = util.getInput('VALUE', 'number');
        util.writeLn(`S.penColor.changeParam(${COLOR_PARAM}, ${VALUE});`);
    };
    statementLibrary['pen_changePenHueBy'] = function (util) {
        const HUE = util.getInput('HUE', 'number');
        util.writeLn('S.penColor.toHSLA();');
        util.writeLn(`S.penColor.x += ${HUE} * 360 / 200;`);
        util.writeLn('S.penColor.y = 100;');
    };
    statementLibrary['pen_changePenShadeBy'] = function (util) {
        const SHADE = util.getInput('SHADE', 'number');
        util.writeLn('S.penColor.toHSLA();');
        util.writeLn(`S.penColor.z = (S.penColor.z + ${SHADE}) % 200;`);
        util.writeLn('if (S.penColor.z < 0) S.penColor.z += 200;');
        util.writeLn('S.penColor.y = 100;');
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
        util.writeLn('S.isPenDown = false;');
    };
    statementLibrary['pen_setPenColorParamTo'] = function (util) {
        const COLOR_PARAM = util.getInput('COLOR_PARAM', 'string');
        const VALUE = util.getInput('VALUE', 'number');
        util.writeLn(`S.penColor.setParam(${COLOR_PARAM}, ${VALUE});`);
    };
    statementLibrary['pen_setPenColorToColor'] = function (util) {
        const COLOR = util.getInput('COLOR', 'color');
        util.writeLn(`S.penColor.setShiftedRGBA(${COLOR});`);
    };
    statementLibrary['pen_setPenHueToNumber'] = function (util) {
        const HUE = util.getInput('HUE', 'number');
        util.writeLn('S.penColor.toHSLA();');
        util.writeLn(`S.penColor.x = ${HUE} * 360 / 200;`);
        util.writeLn('S.penColor.y = 100;');
        util.writeLn('S.penColor.a = 1;');
    };
    statementLibrary['pen_setPenShadeToNumber'] = function (util) {
        const SHADE = util.getInput('SHADE', 'number');
        util.writeLn('S.penColor.toHSLA();');
        util.writeLn(`S.penColor.z = ${SHADE} % 200;`);
        util.writeLn('if (S.penColor.z < 0) S.penColor.z += 200;');
        util.writeLn('S.penColor.y = 100;');
    };
    statementLibrary['pen_setPenSizeTo'] = function (util) {
        const SIZE = util.getInput('SIZE', 'number');
        util.writeLn(`S.penSize = Math.max(1, Math.min(${SIZE}, 1200));`);
    };
    statementLibrary['pen_stamp'] = function (util) {
        util.writeLn('S.stamp();');
        util.visual('always');
    };
    statementLibrary['procedures_call'] = function (util) {
        const mutation = util.block.mutation;
        const name = mutation.proccode;
        if (P.config.debug) {
            if (name === 'forkphorus:debugger;') {
                util.writeLn('/* forkphorus */ debugger;');
                return;
            }
            else if (name === 'forkphorus:throw;') {
                util.writeLn('/* forkphorus */ throw new Error("Debug intended crash");');
                return;
            }
        }
        const label = util.claimNextLabel();
        util.write(`call(S.procedures[${util.sanitizedString(name)}], ${label}, [`);
        const inputNames = JSON.parse(mutation.argumentids);
        for (const inputName of inputNames) {
            util.write(`${util.getInput(inputName, 'any')}, `);
        }
        util.writeLn(']); return;');
        util.addLabel(label);
    };
    statementLibrary['sound_changeeffectby'] = function (util) {
        const EFFECT = util.sanitizedString(util.getField('EFFECT'));
        const VALUE = util.getInput('VALUE', 'number');
        util.writeLn(`S.changeSoundFilter(${EFFECT}, ${VALUE});`);
        util.writeLn('if (updateSoundEffectsOnAllSounds) updateSoundEffectsOnAllSounds();');
        util.waitOneTick();
    };
    statementLibrary['sound_changevolumeby'] = function (util) {
        const VOLUME = util.getInput('VOLUME', 'number');
        util.writeLn(`S.volume = Math.max(0, Math.min(1, S.volume + ${VOLUME} / 100));`);
        util.writeLn('if (S.node) S.node.gain.value = S.volume;');
        util.waitOneTick();
    };
    statementLibrary['sound_cleareffects'] = function (util) {
        util.writeLn('S.resetSoundFilters();');
    };
    statementLibrary['sound_play'] = function (util) {
        const SOUND_MENU = util.getInput('SOUND_MENU', 'any');
        if (P.audio.context) {
            util.writeLn(`var sound = S.getSound(${SOUND_MENU});`);
            util.writeLn('if (sound) startSound(sound);');
        }
    };
    statementLibrary['sound_playuntildone'] = function (util) {
        const SOUND_MENU = util.getInput('SOUND_MENU', 'any');
        if (P.audio.context) {
            util.writeLn(`var sound = S.getSound(${SOUND_MENU});`);
            util.writeLn('if (sound) {');
            util.writeLn('  save();');
            util.writeLn('  R.sound = playSound(sound);');
            util.writeLn('  S.activeSounds.add(R.sound);');
            const label = util.addLabel();
            util.writeLn('  if (!R.sound.node.ended && !R.sound.stopped) {');
            util.forceQueue(label);
            util.writeLn('  }');
            util.writeLn('  S.activeSounds.delete(R.sound);');
            util.writeLn('  restore();');
            util.writeLn('}');
        }
    };
    statementLibrary['sound_seteffectto'] = function (util) {
        const EFFECT = util.sanitizedString(util.getField('EFFECT'));
        const VALUE = util.getInput('VALUE', 'number');
        util.writeLn(`S.setSoundFilter(${EFFECT}, ${VALUE});`);
        util.writeLn('if (updateSoundEffectsOnAllSounds) updateSoundEffectsOnAllSounds();');
        util.writeLn('if (!self.removeLimits) {');
        util.waitOneTick();
        util.writeLn('}');
    };
    statementLibrary['sound_setvolumeto'] = function (util) {
        const VOLUME = util.getInput('VOLUME', 'number');
        util.writeLn(`S.volume = Math.max(0, Math.min(1, ${VOLUME} / 100));`);
        util.writeLn('if (S.node) S.node.gain.value = S.volume;');
        util.writeLn('if (!self.removeLimits) {');
        util.waitOneTick();
        util.writeLn('}');
    };
    statementLibrary['sound_stopallsounds'] = function (util) {
        if (P.audio.context) {
            util.writeLn('self.stopAllSounds();');
        }
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
        util.writeLn('S.say("");');
        util.visual('always');
    };
    statementLibrary['sensing_resettimer'] = function (util) {
        util.writeLn('runtime.resetTimer();');
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
    statementLibrary['text2speech_setVoice'] = function (util) {
        const VOICE = util.getInput('VOICE', 'string');
        util.stage.initTextToSpeech();
        util.writeLn(`self.tts.setVoice(${VOICE});`);
    };
    statementLibrary['text2speech_setLanguage'] = function (util) {
        const LANGUAGE = util.getInput('LANGUAGE', 'string');
        util.stage.initTextToSpeech();
        util.writeLn(`self.tts.setLanguage(${LANGUAGE});`);
    };
    statementLibrary['text2speech_speakAndWait'] = function (util) {
        const WORDS = util.getInput('WORDS', 'string');
        util.stage.initTextToSpeech();
        util.waitUntilSettles(`self.tts.speak(${WORDS})`);
    };
    statementLibrary['videoSensing_videoToggle'] = function (util) {
        const VIDEO_STATE = util.getInput('VIDEO_STATE', 'string');
        util.writeLn(`switch (${VIDEO_STATE}) {`);
        util.writeLn('  case "off": self.showVideo(false); break;');
        util.writeLn('  case "on": self.showVideo(true); break;');
        util.writeLn('}');
    };
    const noopStatement = (util) => util.writeLn('/* noop */');
    statementLibrary['motion_align_scene'] = noopStatement;
    statementLibrary['motion_scroll_right'] = noopStatement;
    statementLibrary['motion_scroll_up'] = noopStatement;
    statementLibrary['looks_changestretchby'] = noopStatement;
    statementLibrary['looks_hideallsprites'] = noopStatement;
    statementLibrary['looks_setstretchto'] = noopStatement;
    inputLibrary['argument_reporter_boolean'] = function (util) {
        const VALUE = util.getField('VALUE');
        if (!util.compiler.state.isProcedure || util.compiler.state.argumentNames.indexOf(VALUE) === -1) {
            const lowerCaseName = VALUE.toLowerCase();
            if (lowerCaseName === 'is compiled?' || lowerCaseName === 'is forkphorus?') {
                return util.booleanInput('true');
            }
            return util.numberInput('0');
        }
        return util.booleanInput(util.asType(`C.args[${util.sanitizedString(VALUE)}]`, 'boolean'));
    };
    inputLibrary['argument_reporter_string_number'] = function (util) {
        const VALUE = util.getField('VALUE');
        if (!util.compiler.state.isProcedure || util.compiler.state.argumentNames.indexOf(VALUE) === -1) {
            return util.numberInput('0');
        }
        return util.anyInput(`C.args[${util.sanitizedString(VALUE)}]`);
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
        return util.numberInput('Math.round(S.scale * 100)');
    };
    inputLibrary['makeymakey_menu_KEY'] = function (util) {
        return util.fieldInput('KEY');
    };
    inputLibrary['makeymakey_menu_SEQUENCE'] = function (util) {
        return util.fieldInput('SEQUENCE');
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
    inputLibrary['music_menu_DRUM'] = function (util) {
        return util.fieldInput('DRUM');
    };
    inputLibrary['music_menu_INSTRUMENT'] = function (util) {
        return util.fieldInput('INSTRUMENT');
    };
    inputLibrary['note'] = function (util) {
        return util.fieldInput('NOTE');
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
        return util.booleanInput(`stringContains(${STRING1}, ${STRING2})`);
    };
    inputLibrary['operator_divide'] = function (util) {
        const NUM1 = util.getInput('NUM1', 'number');
        const NUM2 = util.getInput('NUM2', 'number');
        const input = util.numberInput(`(${NUM1} / ${NUM2})`);
        input.enableFlag(1);
        return input;
    };
    inputLibrary['operator_equals'] = function (util) {
        const OPERAND1 = util.getInput('OPERAND1', 'any');
        const OPERAND2 = util.getInput('OPERAND2', 'any');
        if (!OPERAND1.potentialNumber || !OPERAND2.potentialNumber) {
            return util.booleanInput(`strEqual(${OPERAND1}, ${OPERAND2})`);
        }
        if (P.config.experimentalOptimizations) {
            if (OPERAND1.type === 'number') {
                return util.booleanInput(`numEqualExperimental(${OPERAND1}, ${OPERAND2})`);
            }
            if (OPERAND2.type === 'number') {
                return util.booleanInput(`numEqualExperimental(${OPERAND2}, ${OPERAND1})`);
            }
        }
        return util.booleanInput(`equal(${OPERAND1}, ${OPERAND2})`);
    };
    inputLibrary['operator_gt'] = function (util) {
        const OPERAND1 = util.getInput('OPERAND1', 'any');
        const OPERAND2 = util.getInput('OPERAND2', 'any');
        if (P.config.experimentalOptimizations) {
            if (OPERAND1.type === 'number') {
                return util.booleanInput(`numGreaterExperimental(${OPERAND1}, ${OPERAND2})`);
            }
        }
        return util.booleanInput(`(compare(${OPERAND1}, ${OPERAND2}) === 1)`);
    };
    inputLibrary['operator_join'] = function (util) {
        const STRING1 = util.getInput('STRING1', 'string');
        const STRING2 = util.getInput('STRING2', 'string');
        return util.stringInput(`(${STRING1} + ${STRING2})`);
    };
    inputLibrary['operator_length'] = function (util) {
        const STRING = util.getInput('STRING', 'string');
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
        if (P.config.experimentalOptimizations) {
            if (OPERAND1.type === 'number') {
                return util.booleanInput(`numLessExperimental(${OPERAND1}, ${OPERAND2})`);
            }
        }
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
            case 'sqrt': {
                const input = util.numberInput(`Math.sqrt(${NUM})`);
                input.enableFlag(1);
                return input;
            }
            case 'ceiling':
                return util.numberInput(`Math.ceil(${NUM})`);
            case 'cos':
                return util.numberInput(`(Math.round(Math.cos(${NUM} * Math.PI / 180) * 1e10) / 1e10)`);
            case 'sin':
                return util.numberInput(`(Math.round(Math.sin(${NUM} * Math.PI / 180) * 1e10) / 1e10)`);
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
                return util.numberInput(`Math.pow(10, ${NUM})`);
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
        const FROM = util.getInput('FROM', 'string');
        const TO = util.getInput('TO', 'string');
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
        const COLOR = util.getInput('COLOR', 'color');
        const COLOR2 = util.getInput('COLOR2', 'color');
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
        const KEY_OPTION = util.getInput('KEY_OPTION', 'string');
        return util.booleanInput(`!!self.keys[getKeyCode3(${KEY_OPTION})]`);
    };
    inputLibrary['sensing_loud'] = function (util) {
        util.stage.initMicrophone();
        return util.booleanInput('(self.microphone.getLoudness() > 10)');
    };
    inputLibrary['sensing_loudness'] = function (util) {
        util.stage.initMicrophone();
        return util.numberInput('self.microphone.getLoudness()');
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
        return util.numberInput('((runtime.now() - runtime.timerStart) / 1000)');
    };
    inputLibrary['sensing_touchingcolor'] = function (util) {
        const COLOR = util.getInput('COLOR', 'color');
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
    inputLibrary['text2speech_menu_voices'] = function (util) {
        return util.fieldInput('voices');
    };
    inputLibrary['text2speech_menu_languages'] = function (util) {
        return util.fieldInput('languages');
    };
    inputLibrary['translate_menu_languages'] = function (util) {
        return util.fieldInput('languages');
    };
    inputLibrary['translate_getTranslate'] = function (util) {
        const WORDS = util.getInput('WORDS', 'string');
        const LANGUAGE = util.getInput('LANGUAGE', 'string');
        return WORDS;
    };
    inputLibrary['translate_getViewerLanguage'] = function (util) {
        return util.sanitizedInput('English');
    };
    inputLibrary['videoSensing_menu_VIDEO_STATE'] = function (util) {
        return util.fieldInput('VIDEO_STATE');
    };
    const noopInput = (util) => util.anyInput('undefined');
    inputLibrary['motion_yscroll'] = noopInput;
    inputLibrary['motion_xscroll'] = noopInput;
    inputLibrary['sensing_userid'] = noopInput;
    hatLibrary['control_start_as_clone'] = {
        handle(util) {
            util.target.listeners.whenCloned.push(util.startingFunction);
        },
    };
    hatLibrary['event_whenbackdropswitchesto'] = {
        handle(util) {
            const BACKDROP = util.getField('BACKDROP').toLowerCase();
            if (!util.target.listeners.whenSceneStarts[BACKDROP]) {
                util.target.listeners.whenSceneStarts[BACKDROP] = [];
            }
            util.target.listeners.whenSceneStarts[BACKDROP].push(util.startingFunction);
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
    hatLibrary['event_whengreaterthan'] = {
        precompile(compiler, hat) {
            const WHENGREATERTHANMENU = compiler.getField(hat, 'WHENGREATERTHANMENU');
            const VALUE = compiler.compileInput(hat, 'VALUE', 'number');
            let executeWhen = 'false';
            let stallUntil = 'false';
            switch (WHENGREATERTHANMENU.toLowerCase()) {
                case 'timer':
                    executeWhen = `runtime.whenTimerMSecs / 1000 > ${VALUE}`;
                    stallUntil = `runtime.whenTimerMSecs / 1000 <= ${VALUE}`;
                    break;
                case 'loudness':
                    compiler.target.stage.initMicrophone();
                    executeWhen = `self.microphone.getLoudness() > ${VALUE}`;
                    stallUntil = `self.microphone.getLoudness() <= ${VALUE}`;
                    break;
                default:
                    console.warn('unknown WHENGREATERTHANMENU', WHENGREATERTHANMENU);
            }
            let source = '';
            source += 'if (!R.init) { R.init = true; R.stalled = false; }\n';
            source += `if (R.stalled && (${stallUntil})) { R.stalled = false; }\n`;
            source += `else if (!R.stalled && (${executeWhen})) { R.stalled = true;\n`;
            return source;
        },
        postcompile(compiler, source, hat) {
            source += '}\n';
            source += `forceQueue(${compiler.target.fns.length});`;
            return source;
        },
        handle(util) {
            util.target.listeners.edgeActivated.push(util.startingFunction);
        },
    };
    hatLibrary['event_whenkeypressed'] = {
        handle(util) {
            const KEY_OPTION = util.getField('KEY_OPTION');
            const key = P.runtime.getKeyCode(KEY_OPTION);
            util.target.addWhenKeyPressedHandler(key, util.startingFunction);
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
    function makeymakeyParseKey(key) {
        key = key.toLowerCase();
        if (key === 'up' || key === 'down' || key === 'left' || key === 'right') {
            return P.runtime.getKeyCode(key + ' arrow');
        }
        return P.runtime.getKeyCode(key);
    }
    hatLibrary['makeymakey_whenMakeyKeyPressed'] = {
        handle(util) {
            const KEY = util.getInput('KEY', 'string');
            try {
                const keyValue = '' + util.evaluateInputOnce(KEY);
                if (typeof keyValue !== 'string')
                    throw new Error('cannot accept type: ' + typeof keyValue);
                var keyCode = makeymakeyParseKey(keyValue);
            }
            catch (e) {
                util.compiler.warn('makeymakey key generation error', e);
                return;
            }
            const key = P.runtime.getKeyCode(keyCode);
            util.target.addWhenKeyPressedHandler(key, util.startingFunction);
        },
    };
    hatLibrary['procedures_definition'] = {
        handle(util) {
            const customBlockId = util.block.inputs.custom_block[1];
            const mutation = util.compiler.blocks[customBlockId].mutation;
            const proccode = mutation.proccode;
            if (!util.target.procedures[proccode]) {
                const warp = typeof mutation.warp === 'string' ? mutation.warp === 'true' : mutation.warp;
                const argumentNames = JSON.parse(mutation.argumentnames);
                const procedure = new P.sb3.Scratch3Procedure(util.startingFunction, warp, argumentNames);
                util.target.procedures[proccode] = procedure;
            }
        },
        postcompile(compiler, source, hat) {
            return source + 'endCall(); return;\n';
        },
        precompile(compiler, hat) {
            const customBlockId = hat.inputs.custom_block[1];
            const mutation = compiler.blocks[customBlockId].mutation;
            const warp = typeof mutation.warp === 'string' ? mutation.warp === 'true' : mutation.warp;
            const argumentNames = JSON.parse(mutation.argumentnames);
            compiler.state.isProcedure = true;
            compiler.state.argumentNames = argumentNames;
            if (warp) {
                compiler.state.isWarp = true;
            }
            return '';
        },
    };
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
            if (param === 'dayofweek') {
                return 'day of week';
            }
            return param;
        }
    };
    watcherLibrary['sensing_loudness'] = {
        init(watcher) {
            watcher.stage.initMicrophone();
        },
        evaluate(watcher) {
            if (watcher.stage.microphone) {
                return watcher.stage.microphone.getLoudness();
            }
            else {
                return -1;
            }
        },
        getLabel() { return 'loudness'; },
    };
    watcherLibrary['sensing_timer'] = {
        evaluate(watcher) {
            return (watcher.stage.runtime.now() - watcher.stage.runtime.timerStart) / 1000;
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
var P;
(function (P) {
    var ext;
    (function (ext) {
        class Extension {
            constructor(stage) {
                this.stage = stage;
            }
            destroy() {
            }
            onstart() {
            }
            onpause() {
            }
            update() {
            }
        }
        ext.Extension = Extension;
    })(ext = P.ext || (P.ext = {}));
})(P || (P = {}));
var P;
(function (P) {
    var ext;
    (function (ext) {
        var cloud;
        (function (cloud) {
            const UPDATE_INTERVAL = 1000 / 15;
            function getAllCloudVariables(stage) {
                const result = {};
                for (const variable of stage.cloudVariables) {
                    result[variable] = stage.vars[variable];
                }
                return result;
            }
            cloud.getAllCloudVariables = getAllCloudVariables;
            function isCloudDataMessage(data) {
                if (typeof data !== 'object' || !data) {
                    return false;
                }
                return typeof data.method === 'string';
            }
            function isCloudSetMessage(data) {
                return isCloudDataMessage(data) &&
                    typeof data.name === 'string' &&
                    typeof data.value !== 'undefined';
            }
            class WebSocketCloudHandler extends P.ext.Extension {
                constructor(stage, hosts, id) {
                    super(stage);
                    this.id = id;
                    this.ws = null;
                    this.queuedVariableChanges = [];
                    this.updateInterval = null;
                    this.reconnectTimeout = null;
                    this.shouldReconnect = true;
                    this.failures = 0;
                    this.hosts = Array.isArray(hosts) ? hosts : [hosts];
                    this.logPrefix = '[cloud-ws ' + this.hosts[0] + ']';
                    this.username = this.stage.username;
                    this.interfaceStatusIndicator = document.createElement('div');
                    this.interfaceStatusIndicator.className = 'phosphorus-cloud-status-indicator';
                    stage.ui.appendChild(this.interfaceStatusIndicator);
                    this.handleUpdateInterval = this.handleUpdateInterval.bind(this);
                    this.connect();
                }
                variableChanged(name) {
                    if (this.queuedVariableChanges.indexOf(name) > -1) {
                        return;
                    }
                    this.queuedVariableChanges.push(name);
                    if (this.updateInterval === null) {
                        this.handleUpdateInterval();
                        this.startUpdateInterval();
                    }
                }
                handleUpdateInterval() {
                    if (this.queuedVariableChanges.length === 0) {
                        this.stopUpdateInterval();
                        return;
                    }
                    if (this.ws === null || this.ws.readyState !== this.ws.OPEN || this.ws.bufferedAmount > 16384) {
                        return;
                    }
                    const variableName = this.queuedVariableChanges.shift();
                    const value = this.getVariable(variableName);
                    this.send({
                        method: 'set',
                        name: variableName,
                        value: value,
                    });
                }
                send(data) {
                    if (!this.ws)
                        return;
                    this.ws.send(JSON.stringify(data));
                }
                getVariable(name) {
                    return this.stage.vars[name];
                }
                setVariable(name, value) {
                    this.stage.vars[name] = value;
                }
                terminateConnection(code = 1000) {
                    if (this.ws !== null) {
                        this.ws.close(code);
                        this.ws = null;
                    }
                }
                connect() {
                    if (this.ws !== null) {
                        throw new Error('already connected');
                    }
                    this.setStatusText('Connecting...');
                    console.log(this.logPrefix, 'connecting');
                    this.ws = new WebSocket(this.hosts[this.failures % this.hosts.length]);
                    this.shouldReconnect = true;
                    this.ws.onopen = () => {
                        console.log(this.logPrefix, 'connected');
                        this.setStatusText('Connected');
                        this.setStatusVisible(false);
                        this.failures = 0;
                        this.send({
                            method: 'handshake',
                            project_id: this.id,
                            user: this.username
                        });
                    };
                    this.ws.onmessage = (e) => {
                        try {
                            const lines = e.data.split('\n');
                            for (const line of lines) {
                                const data = JSON.parse(line);
                                this.handleMessage(data);
                            }
                            if (!this.stage.runtime.isRunning) {
                                this.stage.draw();
                            }
                        }
                        catch (err) {
                            console.warn('error parsing cloud server message', e.data, err);
                        }
                    };
                    this.ws.onclose = (e) => {
                        const code = e.code;
                        this.ws = null;
                        console.warn(this.logPrefix, 'closed', code);
                        if (code === 4002) {
                            this.setStatusText('Username is invalid. Change your username to connect.');
                            console.error(this.logPrefix, 'error: Username');
                        }
                        else {
                            this.reconnect();
                        }
                    };
                    this.ws.onerror = (e) => {
                        console.warn(this.logPrefix, 'error', e);
                    };
                }
                reconnect() {
                    if (!this.shouldReconnect) {
                        return;
                    }
                    this.terminateConnection();
                    if (this.reconnectTimeout) {
                        clearTimeout(this.reconnectTimeout);
                    }
                    else {
                        this.failures++;
                    }
                    this.setStatusText('Connection lost, reconnecting...');
                    const delayTime = 2 ** this.failures * 1000 * Math.random();
                    console.log(this.logPrefix, 'reconnecting in', delayTime);
                    this.reconnectTimeout = setTimeout(() => {
                        this.reconnectTimeout = null;
                        this.connect();
                    }, delayTime);
                }
                disconnect() {
                    console.log(this.logPrefix, 'disconnecting');
                    this.shouldReconnect = false;
                    this.terminateConnection();
                }
                handleMessage(data) {
                    if (!isCloudSetMessage(data)) {
                        return;
                    }
                    const { name: variableName, value } = data;
                    if (this.stage.cloudVariables.indexOf(variableName) === -1) {
                        throw new Error('invalid variable name');
                    }
                    this.setVariable(variableName, value);
                }
                startUpdateInterval() {
                    if (this.updateInterval !== null) {
                        return;
                    }
                    this.updateInterval = setInterval(this.handleUpdateInterval, UPDATE_INTERVAL);
                }
                stopUpdateInterval() {
                    if (this.updateInterval === null) {
                        return;
                    }
                    clearInterval(this.updateInterval);
                    this.updateInterval = null;
                }
                setStatusText(text) {
                    this.interfaceStatusIndicator.textContent = `☁ ${text}`;
                    this.setStatusVisible(true);
                }
                setStatusVisible(visible) {
                    this.interfaceStatusIndicator.classList.toggle('phosphorus-cloud-status-indicator-hidden', !visible);
                }
                onstart() {
                    if (this.queuedVariableChanges.length > 0) {
                        this.startUpdateInterval();
                    }
                }
                onpause() {
                    this.stopUpdateInterval();
                }
                update() {
                    if (this.stage.username !== this.username) {
                        console.log(this.logPrefix, 'username changed to', this.stage.username);
                        this.username = this.stage.username;
                        this.terminateConnection(4100);
                        this.reconnect();
                    }
                }
                destroy() {
                    this.stopUpdateInterval();
                    this.disconnect();
                }
            }
            cloud.WebSocketCloudHandler = WebSocketCloudHandler;
            class LocalStorageCloudHandler extends P.ext.Extension {
                constructor(stage, id) {
                    super(stage);
                    this.storageKey = 'cloud-data:' + id;
                    this.load();
                    this.save = this.save.bind(this);
                }
                variableChanged(name) {
                    this.save();
                }
                load() {
                    try {
                        const savedData = localStorage.getItem(this.storageKey);
                        if (savedData === null) {
                            return;
                        }
                        const parsedData = JSON.parse(savedData);
                        for (const key of Object.keys(parsedData)) {
                            if (this.stage.cloudVariables.indexOf(key) > -1) {
                                this.stage.vars[key] = parsedData[key];
                            }
                        }
                    }
                    catch (e) {
                        console.warn('cannot read from localStorage', e);
                    }
                }
                save() {
                    try {
                        localStorage.setItem(this.storageKey, JSON.stringify(getAllCloudVariables(this.stage)));
                    }
                    catch (e) {
                        console.warn('cannot save to localStorage', e);
                    }
                }
            }
            cloud.LocalStorageCloudHandler = LocalStorageCloudHandler;
        })(cloud = ext.cloud || (ext.cloud = {}));
    })(ext = P.ext || (P.ext = {}));
})(P || (P = {}));
/*!
Parts of this file (microphone.ts) are derived from https://github.com/LLK/scratch-audio/blob/develop/src/Loudness.js
*/
var P;
(function (P) {
    var ext;
    (function (ext) {
        var microphone;
        (function (microphone_1) {
            let microphone = null;
            let state = 0;
            const CACHE_TIME = 1000 / 30;
            function createAnalyzerDataArray(analyzer) {
                if (!!analyzer.getFloatTimeDomainData) {
                    return new Float32Array(analyzer.fftSize);
                }
                else if (!!analyzer.getByteTimeDomainData) {
                    return new Uint8Array(analyzer.fftSize);
                }
                else {
                    throw new Error('Analyzer node does not support getFloatTimeDomainData or getByteTimeDomainData');
                }
            }
            function connect() {
                if (state !== 0) {
                    return;
                }
                if (!P.audio.context) {
                    console.warn('Cannot connect to microphone without audio context.');
                    state = 3;
                    return;
                }
                if (!navigator.mediaDevices) {
                    console.warn('Cannot access media devices, probably running in insecure (non-HTTPS) context.');
                    state = 3;
                    return;
                }
                state = 2;
                navigator.mediaDevices.getUserMedia({ audio: true })
                    .then((mediaStream) => {
                    const source = P.audio.context.createMediaStreamSource(mediaStream);
                    const analyzer = P.audio.context.createAnalyser();
                    if (!analyzer.getFloatTimeDomainData) {
                        throw new Error('Missing API getFloatTimeDomainData');
                    }
                    source.connect(analyzer);
                    microphone = {
                        source: source,
                        stream: mediaStream,
                        analyzer,
                        dataArray: createAnalyzerDataArray(analyzer),
                        lastValue: -1,
                        lastCheck: 0,
                    };
                    state = 1;
                })
                    .catch((err) => {
                    console.warn('Cannot connect to microphone: ' + err);
                    state = 3;
                });
            }
            function reinitAnalyser() {
                if (!microphone) {
                    throw new Error('Microphone not connected; cannot re-init something that does not exist!');
                }
                const analyzer = P.audio.context.createAnalyser();
                microphone.source.disconnect();
                microphone.source.connect(analyzer);
                microphone.analyzer = analyzer;
                if (microphone.dataArray.length !== analyzer.fftSize) {
                    microphone.dataArray = createAnalyzerDataArray(analyzer);
                }
            }
            function getLoudness() {
                if (microphone === null) {
                    connect();
                    return -1;
                }
                if (!microphone.stream.active) {
                    return -1;
                }
                if (Date.now() - microphone.lastCheck < CACHE_TIME) {
                    return microphone.lastValue;
                }
                let sum = 0;
                if (microphone.dataArray instanceof Float32Array) {
                    microphone.analyzer.getFloatTimeDomainData(microphone.dataArray);
                    for (let i = 0; i < microphone.dataArray.length; i++) {
                        sum += Math.pow(microphone.dataArray[i], 2);
                    }
                }
                else {
                    microphone.analyzer.getByteTimeDomainData(microphone.dataArray);
                    for (let i = 0; i < microphone.dataArray.length; i++) {
                        sum += Math.pow((microphone.dataArray[i] - 128) / 128, 2);
                    }
                }
                let rms = Math.sqrt(sum / microphone.dataArray.length);
                if (microphone.lastValue !== -1) {
                    rms = Math.max(rms, microphone.lastValue * 0.6);
                }
                microphone.lastValue = rms;
                rms *= 1.63;
                rms = Math.sqrt(rms);
                rms = Math.round(rms * 100);
                rms = Math.min(rms, 100);
                return rms;
            }
            class MicrophoneExtension extends P.ext.Extension {
                getLoudness() {
                    return getLoudness();
                }
                onstart() {
                    if (microphone) {
                        reinitAnalyser();
                    }
                }
            }
            microphone_1.MicrophoneExtension = MicrophoneExtension;
        })(microphone = ext.microphone || (ext.microphone = {}));
    })(ext = P.ext || (P.ext = {}));
})(P || (P = {}));
var P;
(function (P) {
    var ext;
    (function (ext) {
        var tts;
        (function (tts) {
            let Gender;
            (function (Gender) {
                Gender[Gender["Male"] = 0] = "Male";
                Gender[Gender["Female"] = 1] = "Female";
                Gender[Gender["Unknown"] = 2] = "Unknown";
            })(Gender = tts.Gender || (tts.Gender = {}));
            const femaleVoices = [
                /Zira/,
                /female/i,
            ];
            const maleVoices = [
                /David/,
                /\bmale/i,
            ];
            const scratchVoices = {
                ALTO: { gender: Gender.Female, pitch: 1, rate: 1 },
                TENOR: { gender: Gender.Male, pitch: 1.5, rate: 1 },
                GIANT: { gender: Gender.Male, pitch: 0.5, rate: 0.75 },
                SQUEAK: { gender: Gender.Female, pitch: 2, rate: 1.5 },
                KITTEN: { gender: Gender.Female, pitch: 2, rate: 1 },
            };
            class TextToSpeechExtension extends P.ext.Extension {
                constructor(stage) {
                    super(stage);
                    this.language = 'en';
                    this.voice = 'ALTO';
                    this.supported = 'speechSynthesis' in window;
                    if (!this.supported) {
                        console.warn('TTS extension is not supported in this browser: it requires the speechSynthesis API https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis');
                    }
                    else {
                        speechSynthesis.getVoices();
                    }
                }
                getVoiceGender(voice) {
                    if (femaleVoices.some((i) => i.test(voice.name)))
                        return Gender.Female;
                    if (maleVoices.some((i) => i.test(voice.name)))
                        return Gender.Male;
                    return Gender.Unknown;
                }
                getVoiceData(voiceName) {
                    const matchesGender = (voice) => this.getVoiceGender(voice) === voiceGender;
                    const voice = scratchVoices[voiceName];
                    const rate = voice.rate;
                    const pitch = voice.pitch;
                    const voiceGender = scratchVoices[this.voice].gender;
                    const voices = speechSynthesis.getVoices();
                    const matchesLanguage = voices.filter((i) => i.lang.substr(0, 2) === this.language.substr(0, 2));
                    let candidates = matchesLanguage.filter(matchesGender);
                    if (candidates.length === 0)
                        candidates = matchesLanguage;
                    if (candidates.length === 0)
                        candidates = voices;
                    const defaultVoice = candidates.find((i) => i.default);
                    return {
                        voice: defaultVoice || candidates[0] || null,
                        pitch,
                        rate,
                    };
                }
                setVoice(voice) {
                    if (!scratchVoices.hasOwnProperty(voice)) {
                        return;
                    }
                    this.voice = voice;
                }
                setLanguage(language) {
                    this.language = language;
                }
                speak(text) {
                    if (!this.supported) {
                        return Promise.resolve();
                    }
                    if (this.voice === 'KITTEN')
                        text = text.replace(/\w+?\b/g, 'meow');
                    return new Promise((resolve, reject) => {
                        const end = () => resolve();
                        const utterance = new SpeechSynthesisUtterance(text);
                        utterance.lang = this.language;
                        const { voice, rate, pitch } = this.getVoiceData(this.voice);
                        utterance.voice = voice;
                        utterance.rate = rate;
                        utterance.pitch = pitch;
                        utterance.onerror = end;
                        utterance.onend = end;
                        speechSynthesis.speak(utterance);
                        speechSynthesis.resume();
                    });
                }
                onstart() {
                    if (this.supported) {
                        speechSynthesis.resume();
                    }
                }
                onpause() {
                    if (this.supported) {
                        speechSynthesis.pause();
                    }
                }
                destroy() {
                    if (this.supported) {
                        speechSynthesis.cancel();
                    }
                }
            }
            tts.TextToSpeechExtension = TextToSpeechExtension;
        })(tts = ext.tts || (ext.tts = {}));
    })(ext = P.ext || (P.ext = {}));
})(P || (P = {}));
var P;
(function (P) {
    var renderer;
    (function (renderer_1) {
        var canvas2d;
        (function (canvas2d) {
            function getCSSFilter(filters) {
                let filter = '';
                if (filters.brightness) {
                    filter += 'brightness(' + (100 + filters.brightness) + '%) ';
                }
                if (filters.color) {
                    if (filters.color === Infinity) {
                        filter += 'grayscale(100%) ';
                    }
                    else {
                        filter += 'hue-rotate(' + (filters.color / 200 * 360) + 'deg) ';
                    }
                }
                return filter;
            }
            function create2dCanvas() {
                const canvas = document.createElement('canvas');
                canvas.width = 480;
                canvas.height = 360;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    throw new Error('Cannot get 2d rendering context in create2dCanvas');
                }
                ctx.imageSmoothingEnabled = false;
                return { canvas, ctx };
            }
            const COLOR_MASK = 0b111110001111100011110000;
            class SpriteRenderer2D {
                constructor() {
                    this.noEffects = false;
                    this.imageSmoothingEnabled = false;
                    const { canvas, ctx } = create2dCanvas();
                    this.canvas = canvas;
                    this.ctx = ctx;
                }
                reset(scale) {
                    this._reset(this.ctx, scale);
                }
                drawChild(c) {
                    this._drawChild(c, this.ctx);
                }
                drawObjects(children) {
                    for (var i = 0; i < children.length; i++) {
                        var child = children[i];
                        if (!child.visible) {
                            continue;
                        }
                        this.drawChild(child);
                    }
                }
                _reset(ctx, scale) {
                    const effectiveScale = scale * P.config.scale;
                    const width = Math.max(1, 480 * effectiveScale);
                    const height = Math.max(1, 360 * effectiveScale);
                    ctx.canvas.width = width;
                    ctx.canvas.height = height;
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
                    if (P.core.isSprite(c)) {
                        if (c.rotationStyle === 0) {
                            ctx.rotate((c.direction - 90) * Math.PI / 180);
                        }
                        else if (c.rotationStyle === 1 && c.direction < 0) {
                            ctx.scale(-1, 1);
                        }
                        objectScale *= c.scale;
                    }
                    if (costume.isScalable) {
                        costume.requestSize(objectScale * globalScale);
                    }
                    ctx.imageSmoothingEnabled = costume.isScalable || this.imageSmoothingEnabled;
                    const image = costume.getImage();
                    const x = -costume.rotationCenterX * objectScale | 0;
                    const y = -costume.rotationCenterY * objectScale | 0;
                    const w = costume.width * objectScale;
                    const h = costume.height * objectScale;
                    if (w < 1 || h < 1) {
                        ctx.restore();
                        return;
                    }
                    if (!this.noEffects) {
                        ctx.globalAlpha = Math.max(0, Math.min(1, 1 - c.filters.ghost / 100));
                        if (c.filters.brightness !== 0 && c.filters.color === 0) {
                            workingRenderer.canvas.width = w;
                            workingRenderer.canvas.height = h;
                            workingRenderer.ctx.save();
                            workingRenderer.ctx.imageSmoothingEnabled = false;
                            workingRenderer.ctx.translate(0, 0);
                            workingRenderer.ctx.drawImage(image, 0, 0, w, h);
                            workingRenderer.ctx.globalCompositeOperation = 'source-atop';
                            workingRenderer.ctx.globalAlpha = Math.abs(c.filters.brightness / 100);
                            if (c.filters.brightness > 0) {
                                workingRenderer.ctx.fillStyle = 'white';
                            }
                            else {
                                workingRenderer.ctx.fillStyle = 'black';
                            }
                            workingRenderer.ctx.fillRect(0, 0, w, h);
                            ctx.drawImage(workingRenderer.canvas, x, y);
                            workingRenderer.ctx.restore();
                        }
                        else {
                            const filter = getCSSFilter(c.filters);
                            if (filter !== '') {
                                ctx.filter = filter;
                            }
                            ctx.drawImage(image, x, y, w, h);
                        }
                    }
                    else {
                        ctx.drawImage(image, x, y, w, h);
                    }
                    ctx.restore();
                }
            }
            canvas2d.SpriteRenderer2D = SpriteRenderer2D;
            const workingRenderer = new SpriteRenderer2D();
            const workingRenderer2 = new SpriteRenderer2D();
            class ProjectRenderer2D extends SpriteRenderer2D {
                constructor(stage) {
                    super();
                    this.stage = stage;
                    this.zoom = 1;
                    this.penScalingEnabled = true;
                    this.penModified = false;
                    this.penTargetZoom = -1;
                    this.penZoom = 1;
                    this.stageCostumeIndex = -1;
                    const { ctx: stageContext, canvas: stageLayer } = create2dCanvas();
                    this.stageContext = stageContext;
                    this.stageLayer = stageLayer;
                    const { ctx: penContext, canvas: penLayer } = create2dCanvas();
                    this.penContext = penContext;
                    this.penLayer = penLayer;
                }
                onStageFiltersChanged() {
                    this.renderStageCostume(this.zoom);
                }
                renderStageCostume(scale) {
                    this._reset(this.stageContext, scale);
                    this._drawChild(this.stage, this.stageContext);
                }
                init(root) {
                    root.appendChild(this.stageLayer);
                    root.appendChild(this.penLayer);
                    root.appendChild(this.canvas);
                }
                destroy() {
                }
                drawFrame() {
                    this.reset(this.zoom);
                    this.drawObjects(this.stage.children);
                    if (this.stage.currentCostumeIndex !== this.stageCostumeIndex) {
                        this.stageCostumeIndex = this.stage.currentCostumeIndex;
                        this.renderStageCostume(this.zoom);
                    }
                }
                drawAllExcept(renderer, skip) {
                    renderer.drawChild(this.stage);
                    renderer.ctx.drawImage(this.penLayer, 0, 0, 480, 360);
                    for (var i = 0; i < this.stage.children.length; i++) {
                        var child = this.stage.children[i];
                        if (!child.visible || child === skip) {
                            continue;
                        }
                        renderer.drawChild(child);
                    }
                }
                resize(zoom) {
                    this.zoom = zoom;
                    this.resizePen(zoom);
                    this.renderStageCostume(this.zoom);
                }
                resizePen(zoom) {
                    if (!this.penScalingEnabled) {
                        return;
                    }
                    if (zoom > this.penZoom) {
                        this.penZoom = zoom;
                        workingRenderer.canvas.width = this.penLayer.width;
                        workingRenderer.canvas.height = this.penLayer.height;
                        workingRenderer.ctx.drawImage(this.penLayer, 0, 0);
                        this._reset(this.penContext, zoom);
                        this.penContext.drawImage(workingRenderer.canvas, 0, 0, 480, 360);
                    }
                    else if (!this.penModified) {
                        this.penZoom = zoom;
                        this._reset(this.penContext, zoom);
                    }
                    else {
                        this.penTargetZoom = zoom;
                    }
                }
                penClear() {
                    this.penModified = false;
                    if (this.penTargetZoom !== -1) {
                        this._reset(this.penContext, this.penTargetZoom);
                        this.penZoom = this.penTargetZoom;
                        this.penTargetZoom = -1;
                    }
                    this.penContext.clearRect(0, 0, 480, 360);
                }
                penDot(color, size, x, y) {
                    this.penModified = true;
                    this.penContext.fillStyle = color.toCSS();
                    this.penContext.beginPath();
                    this.penContext.arc(240 + x, 180 - y, size / 2, 0, 2 * Math.PI, false);
                    this.penContext.fill();
                }
                penLine(color, size, x1, y1, x2, y2) {
                    this.penModified = true;
                    this.penContext.lineCap = 'round';
                    if (this.penZoom === 1) {
                        if (size % 2 > .5 && size % 2 < 1.5) {
                            x1 -= .5;
                            y1 -= .5;
                            x2 -= .5;
                            y2 -= .5;
                        }
                    }
                    this.penContext.strokeStyle = color.toCSS();
                    this.penContext.lineWidth = size;
                    this.penContext.beginPath();
                    this.penContext.moveTo(240 + x1, 180 - y1);
                    this.penContext.lineTo(240 + x2, 180 - y2);
                    this.penContext.stroke();
                }
                penStamp(sprite) {
                    this.penModified = true;
                    this._drawChild(sprite, this.penContext);
                }
                spriteTouchesPoint(sprite, x, y) {
                    const bounds = sprite.rotatedBounds();
                    if (x < bounds.left || y < bounds.bottom || x > bounds.right || y > bounds.top || sprite.scale === 0) {
                        return false;
                    }
                    const costume = sprite.costumes[sprite.currentCostumeIndex];
                    var cx = (x - sprite.scratchX) / sprite.scale;
                    var cy = (sprite.scratchY - y) / sprite.scale;
                    if (sprite.rotationStyle === 0 && sprite.direction !== 90) {
                        const d = (90 - sprite.direction) * Math.PI / 180;
                        const ox = cx;
                        const s = Math.sin(d), c = Math.cos(d);
                        cx = c * ox - s * cy;
                        cy = s * ox + c * cy;
                    }
                    else if (sprite.rotationStyle === 1 && sprite.direction < 0) {
                        cx = -cx;
                    }
                    let positionX = Math.round(cx / costume.scale + costume.rotationCenterX);
                    let positionY = Math.round(cy / costume.scale + costume.rotationCenterY);
                    if (costume instanceof P.core.VectorCostume) {
                        positionX *= costume.currentScale;
                        positionY *= costume.currentScale;
                    }
                    if (!Number.isFinite(positionX) || !Number.isFinite(positionY)) {
                        return false;
                    }
                    const data = costume.getContext().getImageData(positionX, positionY, 1, 1).data;
                    return data[3] !== 0;
                }
                spritesIntersect(spriteA, otherSprites) {
                    const mb = spriteA.rotatedBounds();
                    for (var i = 0; i < otherSprites.length; i++) {
                        const spriteB = otherSprites[i];
                        if (!spriteB.visible || spriteA === spriteB) {
                            continue;
                        }
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
                            if (data[j + 3]) {
                                return true;
                            }
                        }
                    }
                    return false;
                }
                spriteTouchesColor(sprite, color) {
                    const b = sprite.rotatedBounds();
                    const width = b.right - b.left;
                    const height = b.top - b.bottom;
                    if (width < 1 || height < 1 || width !== width || height !== height) {
                        return false;
                    }
                    workingRenderer.canvas.width = width;
                    workingRenderer.canvas.height = height;
                    workingRenderer.ctx.fillStyle = 'white';
                    workingRenderer.ctx.fillRect(0, 0, width, height);
                    workingRenderer.ctx.save();
                    workingRenderer.ctx.translate(-(240 + b.left), -(180 - b.top));
                    this.drawAllExcept(workingRenderer, sprite);
                    workingRenderer.ctx.globalCompositeOperation = 'destination-in';
                    workingRenderer.drawChild(sprite);
                    workingRenderer.ctx.restore();
                    const data = workingRenderer.ctx.getImageData(0, 0, width, height).data;
                    color = color & COLOR_MASK;
                    const length = data.length;
                    for (var i = 0; i < length; i += 4) {
                        if (((data[i] << 16 | data[i + 1] << 8 | data[i + 2]) & COLOR_MASK) === color && data[i + 3]) {
                            return true;
                        }
                    }
                    return false;
                }
                spriteColorTouchesColor(sprite, spriteColor, otherColor) {
                    var rb = sprite.rotatedBounds();
                    const width = rb.right - rb.left;
                    const height = rb.top - rb.bottom;
                    if (width < 1 || height < 1 || width !== width || height !== height) {
                        return false;
                    }
                    workingRenderer.canvas.width = workingRenderer2.canvas.width = width;
                    workingRenderer.canvas.height = workingRenderer2.canvas.height = height;
                    workingRenderer.ctx.save();
                    workingRenderer2.ctx.save();
                    workingRenderer.ctx.translate(-(240 + rb.left), -(180 - rb.top));
                    workingRenderer2.ctx.translate(-(240 + rb.left), -(180 - rb.top));
                    this.drawAllExcept(workingRenderer, sprite);
                    workingRenderer2.drawChild(sprite);
                    workingRenderer.ctx.restore();
                    workingRenderer2.ctx.restore();
                    var dataA = workingRenderer.ctx.getImageData(0, 0, width, height).data;
                    var dataB = workingRenderer2.ctx.getImageData(0, 0, width, height).data;
                    spriteColor = spriteColor & COLOR_MASK;
                    otherColor = otherColor & COLOR_MASK;
                    var length = dataA.length;
                    for (var i = 0; i < length; i += 4) {
                        var touchesSource = ((dataB[i] << 16 | dataB[i + 1] << 8 | dataB[i + 2]) & COLOR_MASK) === spriteColor && dataB[i + 3];
                        var touchesOther = ((dataA[i] << 16 | dataA[i + 1] << 8 | dataA[i + 2]) & COLOR_MASK) === otherColor && dataA[i + 3];
                        if (touchesSource && touchesOther) {
                            return true;
                        }
                    }
                    return false;
                }
            }
            canvas2d.ProjectRenderer2D = ProjectRenderer2D;
        })(canvas2d = renderer_1.canvas2d || (renderer_1.canvas2d = {}));
    })(renderer = P.renderer || (P.renderer = {}));
})(P || (P = {}));
var P;
(function (P) {
    var m3;
    (function (m3) {
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
var P;
(function (P) {
    var renderer;
    (function (renderer) {
        var webgl;
        (function (webgl) {
            function createCanvas() {
                const canvas = document.createElement('canvas');
                canvas.width = 480;
                canvas.height = 360;
                return canvas;
            }
            const horizontalInvertMatrix = P.m3.scaling(-1, 1);
            class Shader {
                constructor(gl, program) {
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
                        this.attributeLocations[info.name] = gl.getAttribLocation(program, info.name);
                    }
                }
                uniform1f(name, value) {
                    const location = this.getUniform(name);
                    this.gl.uniform1f(location, value);
                }
                uniform2f(name, a, b) {
                    const location = this.getUniform(name);
                    this.gl.uniform2f(location, a, b);
                }
                uniform4f(name, a, b, c, d) {
                    const location = this.getUniform(name);
                    this.gl.uniform4f(location, a, b, c, d);
                }
                uniformMatrix3(name, value) {
                    const location = this.getUniform(name);
                    this.gl.uniformMatrix3fv(location, false, value);
                }
                hasUniform(name) {
                    return this.uniformLocations.hasOwnProperty(name);
                }
                getUniform(name) {
                    if (!this.hasUniform(name)) {
                        throw new Error('uniform of name ' + name + ' does not exist');
                    }
                    return this.uniformLocations[name];
                }
                attributeBuffer(name, value) {
                    if (!this.hasAttribute(name)) {
                        throw new Error('attribute of name ' + name + ' does not exist');
                    }
                    const location = this.attributeLocations[name];
                    this.gl.enableVertexAttribArray(location);
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, value);
                    this.gl.vertexAttribPointer(location, 2, this.gl.FLOAT, false, 0, 0);
                }
                hasAttribute(name) {
                    return this.attributeLocations.hasOwnProperty(name);
                }
                getAttribute(name) {
                    if (!this.hasAttribute(name)) {
                        throw new Error('attribute of name ' + name + ' does not exist');
                    }
                    return this.attributeLocations[name];
                }
            }
            class WebGLSpriteRenderer {
                constructor() {
                    this.globalScaleMatrix = P.m3.scaling(1, 1);
                    this.costumeTextures = new Map();
                    this.canvas = createCanvas();
                    const gl = this.canvas.getContext('webgl', this.getContextOptions());
                    if (!gl) {
                        throw new Error('cannot get webgl rendering context');
                    }
                    this.gl = gl;
                    this.noFiltersShader = this.createShader(WebGLSpriteRenderer.vertexShader, WebGLSpriteRenderer.fragmentShader, []);
                    this.allFiltersShader = this.createShader(WebGLSpriteRenderer.vertexShader, WebGLSpriteRenderer.fragmentShader, [
                        'ENABLE_BRIGHTNESS',
                        'ENABLE_COLOR',
                        'ENABLE_GHOST',
                        'ENABLE_FISHEYE',
                        'ENABLE_MOSAIC',
                        'ENABLE_PIXELATE',
                    ]);
                    this.gl.enable(this.gl.BLEND);
                    this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
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
                    this.reset(1);
                }
                getContextOptions() {
                    return {
                        alpha: false,
                    };
                }
                compileShader(type, source, definitions) {
                    if (definitions) {
                        for (const def of definitions) {
                            source = '#define ' + def + '\n' + source;
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
                createShader(vs, fs, definitions) {
                    const program = this.compileProgram(vs, fs, definitions);
                    return new Shader(this.gl, program);
                }
                convertToTexture(canvas) {
                    const texture = this.gl.createTexture();
                    if (!texture) {
                        throw new Error('Cannot create texture');
                    }
                    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
                    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, canvas);
                    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
                    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
                    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
                    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
                    return texture;
                }
                destroy() {
                    const extension = this.gl.getExtension('WEBGL_lose_context');
                    if (extension) {
                        extension.loseContext();
                    }
                }
                reset(scale) {
                    this.canvas.width = scale * 480;
                    this.canvas.height = scale * 360;
                    this.gl.viewport(0, 0, scale * 480, scale * 360);
                    if (this.globalScaleMatrix[0] !== scale) {
                        this.globalScaleMatrix = P.m3.scaling(scale, scale);
                    }
                    this.gl.clearColor(1, 1, 1, 1);
                    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
                }
                useShader(shader) {
                    this.gl.useProgram(shader.program);
                    this.shader = shader;
                }
                drawChild(child) {
                    const costume = child.costumes[child.currentCostumeIndex];
                    if (!this.costumeTextures.has(costume)) {
                        const image = costume.getImage();
                        const texture = this.convertToTexture(image);
                        this.costumeTextures.set(costume, texture);
                    }
                    this.gl.bindTexture(this.gl.TEXTURE_2D, this.costumeTextures.get(costume));
                    this.shader.attributeBuffer('a_position', this.quadBuffer);
                    const matrix = P.m3.projection(this.canvas.width, this.canvas.height);
                    P.m3.multiply(matrix, this.globalScaleMatrix);
                    P.m3.multiply(matrix, P.m3.translation(240 + child.scratchX | 0, 180 - child.scratchY | 0));
                    if (P.core.isSprite(child)) {
                        if (child.rotationStyle === 0 && child.direction !== 90) {
                            P.m3.multiply(matrix, P.m3.rotation(90 - child.direction));
                        }
                        else if (child.rotationStyle === 1 && child.direction < 0) {
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
                    this.shader.uniformMatrix3('u_matrix', matrix);
                    if (this.shader.hasUniform('u_opacity')) {
                        this.shader.uniform1f('u_opacity', 1 - child.filters.ghost / 100);
                    }
                    if (this.shader.hasUniform('u_brightness')) {
                        this.shader.uniform1f('u_brightness', child.filters.brightness / 100);
                    }
                    if (this.shader.hasUniform('u_color')) {
                        this.shader.uniform1f('u_color', child.filters.color / 200);
                    }
                    if (this.shader.hasUniform('u_mosaic')) {
                        const mosaic = Math.round((Math.abs(child.filters.mosaic) + 10) / 10);
                        this.shader.uniform1f('u_mosaic', P.utils.clamp(mosaic, 1, 512));
                    }
                    if (this.shader.hasUniform('u_whirl')) {
                        this.shader.uniform1f('u_whirl', child.filters.whirl * Math.PI / -180);
                    }
                    if (this.shader.hasUniform('u_fisheye')) {
                        this.shader.uniform1f('u_fisheye', Math.max(0, (child.filters.fisheye + 100) / 100));
                    }
                    if (this.shader.hasUniform('u_pixelate')) {
                        this.shader.uniform1f('u_pixelate', Math.abs(child.filters.pixelate) / 10);
                    }
                    if (this.shader.hasUniform('u_size')) {
                        this.shader.uniform2f('u_size', costume.width, costume.height);
                    }
                    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
                }
                drawTextureOverlay(texture) {
                    const shader = this.noFiltersShader;
                    this.gl.useProgram(shader.program);
                    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
                    shader.attributeBuffer('a_position', this.quadBuffer);
                    const matrix = P.m3.projection(this.canvas.width, this.canvas.height);
                    P.m3.multiply(matrix, this.globalScaleMatrix);
                    P.m3.multiply(matrix, P.m3.translation(240, 180));
                    P.m3.multiply(matrix, P.m3.scaling(1, 1));
                    P.m3.multiply(matrix, P.m3.translation(-240, -180));
                    P.m3.multiply(matrix, P.m3.scaling(480, 360));
                    shader.uniformMatrix3('u_matrix', matrix);
                    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
                }
            }
            WebGLSpriteRenderer.vertexShader = `
    attribute vec2 a_position;

    uniform mat3 u_matrix;

    varying vec2 v_texcoord;

    void main() {
      gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
      v_texcoord = a_position;
    }
    `;
            WebGLSpriteRenderer.fragmentShader = `
    precision mediump float;

    varying vec2 v_texcoord;

    uniform sampler2D u_texture;

    #ifdef ENABLE_BRIGHTNESS
      uniform float u_brightness;
    #endif
    #ifdef ENABLE_COLOR
      uniform float u_color;
    #endif
    #ifdef ENABLE_GHOST
      uniform float u_opacity;
    #endif
    #ifdef ENABLE_MOSAIC
      uniform float u_mosaic;
    #endif
    #ifdef ENABLE_WHIRL
      uniform float u_whirl;
    #endif
    #ifdef ENABLE_FISHEYE
      uniform float u_fisheye;
    #endif
    #ifdef ENABLE_PIXELATE
      uniform float u_pixelate;
      uniform vec2 u_size;
    #endif
    #ifdef ENABLE_COLOR_TEST
      uniform vec3 u_colorTest;
    #endif

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

      #ifdef ENABLE_MOSAIC
      if (u_mosaic != 1.0) {
        texcoord = fract(u_mosaic * v_texcoord);
      }
      #endif

      #ifdef ENABLE_PIXELATE
      if (u_pixelate != 0.0) {
        vec2 texelSize = u_size / u_pixelate;
        texcoord = (floor(texcoord * texelSize) + vecCenter) / texelSize;
      }
      #endif

      #ifdef ENABLE_WHIRL
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
      #endif

      #ifdef ENABLE_FISHEYE
      {
        vec2 vec = (texcoord - vecCenter) / vecCenter;
        float vecLength = length(vec);
        float r = pow(min(vecLength, 1.0), u_fisheye) * max(1.0, vecLength);
        vec2 unit = vec / vecLength;
        texcoord = vecCenter + r * unit * vecCenter;
      }
      #endif

      vec4 color = texture2D(u_texture, texcoord);
      #ifndef DISABLE_MINIMUM_ALPHA
      if (color.a < minimumAlpha) {
        discard;
      }
      #endif

      #ifdef ENABLE_GHOST
        color.a *= u_opacity;
      #endif

      #ifdef ENABLE_COLOR
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

      #ifdef ENABLE_BRIGHTNESS
        color.rgb = clamp(color.rgb + vec3(u_brightness), 0.0, 1.0);
      #endif

      #ifdef ENABLE_COLOR_TEST
        if (color.rgb != u_colorTest) {
          color = vec4(0.0, 0.0, 0.0, 0.0);
        }
      #endif

      gl_FragColor = color;
    }
    `;
            class CollisionRenderer extends WebGLSpriteRenderer {
                constructor() {
                    super();
                    this.gl.enable(this.gl.SCISSOR_TEST);
                    this.gl.scissor(0, 0, 480, 360);
                    this.gl.clearColor(0, 0, 0, 0);
                    this.touchingShader = this.createShader(CollisionRenderer.vertexShader, WebGLSpriteRenderer.fragmentShader, ['DISABLE_MINIMUM_ALPHA']);
                    this.shapeFiltersShader = this.createShader(CollisionRenderer.vertexShader, WebGLSpriteRenderer.fragmentShader, [
                        'ENABLE_FISHEYE',
                        'ENABLE_PIXELATE',
                        'ENABLE_MOSAIC',
                    ]);
                    this.touchingColorShader = this.createShader(CollisionRenderer.vertexShader, WebGLSpriteRenderer.fragmentShader, [
                        'DISABLE_MINIMUM_ALPHA',
                        'ENABLE_COLOR_TEST',
                    ]);
                }
                getContextOptions() {
                    return {
                        alpha: true
                    };
                }
                spritesIntersect(spriteA, otherSprites) {
                    const mb = spriteA.rotatedBounds();
                    for (const spriteB of otherSprites) {
                        if (!spriteB.visible || spriteA === spriteB) {
                            continue;
                        }
                        const ob = spriteB.rotatedBounds();
                        if (mb.bottom >= ob.top || ob.bottom >= mb.top || mb.left >= ob.right || ob.left >= mb.right) {
                            continue;
                        }
                        const left = Math.max(mb.left, ob.left);
                        const top = Math.min(mb.top, ob.top);
                        const right = Math.min(mb.right, ob.right);
                        const bottom = Math.max(mb.bottom, ob.bottom);
                        const width = Math.max(right - left, 1);
                        const height = Math.max(top - bottom, 1);
                        this.gl.scissor(240 + left, 180 + bottom, width, height);
                        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
                        this.useShader(this.allFiltersShader);
                        this.drawChild(spriteA);
                        this.gl.blendFunc(this.gl.DST_ALPHA, this.gl.ZERO);
                        this.useShader(this.touchingShader);
                        this.drawChild(spriteB);
                        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
                        var data = new Uint8Array(width * height * 4);
                        this.gl.readPixels(240 + left, 180 + bottom, width, height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, data);
                        this.gl.scissor(0, 0, 480, 360);
                        var length = data.length;
                        for (var j = 0; j < length; j += 4) {
                            if (data[j + 3]) {
                                return true;
                            }
                        }
                    }
                    return false;
                }
                spriteTouchesPoint(sprite, x, y) {
                    const bounds = sprite.rotatedBounds();
                    if (x < bounds.left || y < bounds.bottom || x > bounds.right || y > bounds.top || sprite.scale === 0) {
                        return false;
                    }
                    const cx = 240 + x | 0;
                    const cy = 180 + y | 0;
                    this.gl.scissor(cx, cy, 1, 1);
                    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
                    this.useShader(this.shapeFiltersShader);
                    this.drawChild(sprite);
                    const result = new Uint8Array(4);
                    this.gl.readPixels(cx, cy, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, result);
                    this.gl.scissor(0, 0, 480, 360);
                    return result[3] !== 0;
                }
            }
            class PenRenderer extends WebGLSpriteRenderer {
                constructor() {
                    super();
                    this.dirty = false;
                    this.penCoords = new Float32Array(65536);
                    this.penLines = new Float32Array(32768);
                    this.penColors = new Float32Array(65536);
                    this.penCoordsIndex = 0;
                    this.penLinesIndex = 0;
                    this.penColorsIndex = 0;
                    this.penShader = this.createShader(PenRenderer.PEN_VERTEX_SHADER, PenRenderer.PEN_FRAGMENT_SHADER);
                    this.positionBuffer = this.gl.createBuffer();
                    this.lineBuffer = this.gl.createBuffer();
                    this.colorBuffer = this.gl.createBuffer();
                    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
                }
                getContextOptions() {
                    return {
                        alpha: true,
                        preserveDrawingBuffer: true,
                    };
                }
                pendingPenOperations() {
                    return this.penLinesIndex > 0;
                }
                drawPendingOperations() {
                    const gl = this.gl;
                    this.dirty = true;
                    this.useShader(this.penShader);
                    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, this.penCoords, gl.STREAM_DRAW);
                    gl.vertexAttribPointer(this.penShader.getAttribute('a_vertexData'), 4, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(this.penShader.getAttribute('a_vertexData'));
                    gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, this.penLines, gl.STREAM_DRAW);
                    gl.vertexAttribPointer(this.penShader.getAttribute('a_lineData'), 2, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(this.penShader.getAttribute('a_lineData'));
                    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, this.penColors, gl.STREAM_DRAW);
                    gl.vertexAttribPointer(this.penShader.getAttribute('a_color'), 4, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(this.penShader.getAttribute('a_color'));
                    gl.drawArrays(gl.TRIANGLES, 0, (this.penCoordsIndex + 1) / 4);
                    this.penCoordsIndex = 0;
                    this.penLinesIndex = 0;
                    this.penColorsIndex = 0;
                }
                buffersCanFit(size) {
                    return this.penCoordsIndex + size > this.penCoords.length;
                }
                getCircleResolution(size) {
                    return Math.max(Math.ceil(size), 3);
                }
                penLine(color, size, x1, y1, x2, y2) {
                    const circleRes = this.getCircleResolution(size);
                    if (this.buffersCanFit(24 * (circleRes + 1))) {
                        this.drawPendingOperations();
                    }
                    this.penCoords[this.penCoordsIndex] = x1;
                    this.penCoordsIndex++;
                    this.penCoords[this.penCoordsIndex] = y1;
                    this.penCoordsIndex++;
                    this.penCoords[this.penCoordsIndex] = x2;
                    this.penCoordsIndex++;
                    this.penCoords[this.penCoordsIndex] = y2;
                    this.penCoordsIndex++;
                    this.penLines[this.penLinesIndex] = -Math.PI / 2;
                    this.penLinesIndex++;
                    this.penLines[this.penLinesIndex] = size / 2;
                    this.penLinesIndex++;
                    this.penCoords[this.penCoordsIndex] = x2;
                    this.penCoordsIndex++;
                    this.penCoords[this.penCoordsIndex] = y2;
                    this.penCoordsIndex++;
                    this.penCoords[this.penCoordsIndex] = x1;
                    this.penCoordsIndex++;
                    this.penCoords[this.penCoordsIndex] = y1;
                    this.penCoordsIndex++;
                    this.penLines[this.penLinesIndex] = Math.PI / 2;
                    this.penLinesIndex++;
                    this.penLines[this.penLinesIndex] = size / 2;
                    this.penLinesIndex++;
                    this.penCoords[this.penCoordsIndex] = x1;
                    this.penCoordsIndex++;
                    this.penCoords[this.penCoordsIndex] = y1;
                    this.penCoordsIndex++;
                    this.penCoords[this.penCoordsIndex] = x2;
                    this.penCoordsIndex++;
                    this.penCoords[this.penCoordsIndex] = y2;
                    this.penCoordsIndex++;
                    this.penLines[this.penLinesIndex] = Math.PI / 2;
                    this.penLinesIndex++;
                    this.penLines[this.penLinesIndex] = size / 2;
                    this.penLinesIndex++;
                    this.penCoords[this.penCoordsIndex] = x1;
                    this.penCoordsIndex++;
                    this.penCoords[this.penCoordsIndex] = y1;
                    this.penCoordsIndex++;
                    this.penCoords[this.penCoordsIndex] = x2;
                    this.penCoordsIndex++;
                    this.penCoords[this.penCoordsIndex] = y2;
                    this.penCoordsIndex++;
                    this.penLines[this.penLinesIndex] = Math.PI / 2;
                    this.penLinesIndex++;
                    this.penLines[this.penLinesIndex] = size / 2;
                    this.penLinesIndex++;
                    this.penCoords[this.penCoordsIndex] = x2;
                    this.penCoordsIndex++;
                    this.penCoords[this.penCoordsIndex] = y2;
                    this.penCoordsIndex++;
                    this.penCoords[this.penCoordsIndex] = x1;
                    this.penCoordsIndex++;
                    this.penCoords[this.penCoordsIndex] = y1;
                    this.penCoordsIndex++;
                    this.penLines[this.penLinesIndex] = -Math.PI / 2;
                    this.penLinesIndex++;
                    this.penLines[this.penLinesIndex] = size / 2;
                    this.penLinesIndex++;
                    this.penCoords[this.penCoordsIndex] = x2;
                    this.penCoordsIndex++;
                    this.penCoords[this.penCoordsIndex] = y2;
                    this.penCoordsIndex++;
                    this.penCoords[this.penCoordsIndex] = x1;
                    this.penCoordsIndex++;
                    this.penCoords[this.penCoordsIndex] = y1;
                    this.penCoordsIndex++;
                    this.penLines[this.penLinesIndex] = Math.PI / 2;
                    this.penLinesIndex++;
                    this.penLines[this.penLinesIndex] = size / 2;
                    this.penLinesIndex++;
                    for (var i = 0; i < circleRes; i++) {
                        this.penCoords[this.penCoordsIndex] = x2;
                        this.penCoordsIndex++;
                        this.penCoords[this.penCoordsIndex] = y2;
                        this.penCoordsIndex++;
                        this.penCoords[this.penCoordsIndex] = x1;
                        this.penCoordsIndex++;
                        this.penCoords[this.penCoordsIndex] = y1;
                        this.penCoordsIndex++;
                        this.penLines[this.penLinesIndex] = 0;
                        this.penLinesIndex++;
                        this.penLines[this.penLinesIndex] = 0;
                        this.penLinesIndex++;
                        this.penCoords[this.penCoordsIndex] = x2;
                        this.penCoordsIndex++;
                        this.penCoords[this.penCoordsIndex] = y2;
                        this.penCoordsIndex++;
                        this.penCoords[this.penCoordsIndex] = x1;
                        this.penCoordsIndex++;
                        this.penCoords[this.penCoordsIndex] = y1;
                        this.penCoordsIndex++;
                        this.penLines[this.penLinesIndex] = Math.PI / 2 + i / circleRes * Math.PI;
                        this.penLinesIndex++;
                        this.penLines[this.penLinesIndex] = size / 2;
                        this.penLinesIndex++;
                        this.penCoords[this.penCoordsIndex] = x2;
                        this.penCoordsIndex++;
                        this.penCoords[this.penCoordsIndex] = y2;
                        this.penCoordsIndex++;
                        this.penCoords[this.penCoordsIndex] = x1;
                        this.penCoordsIndex++;
                        this.penCoords[this.penCoordsIndex] = y1;
                        this.penCoordsIndex++;
                        this.penLines[this.penLinesIndex] = Math.PI / 2 + (i + 1) / circleRes * Math.PI;
                        this.penLinesIndex++;
                        this.penLines[this.penLinesIndex] = size / 2;
                        this.penLinesIndex++;
                        this.penCoords[this.penCoordsIndex] = x1;
                        this.penCoordsIndex++;
                        this.penCoords[this.penCoordsIndex] = y1;
                        this.penCoordsIndex++;
                        this.penCoords[this.penCoordsIndex] = x2;
                        this.penCoordsIndex++;
                        this.penCoords[this.penCoordsIndex] = y2;
                        this.penCoordsIndex++;
                        this.penLines[this.penLinesIndex] = 0;
                        this.penLinesIndex++;
                        this.penLines[this.penLinesIndex] = 0;
                        this.penLinesIndex++;
                        this.penCoords[this.penCoordsIndex] = x1;
                        this.penCoordsIndex++;
                        this.penCoords[this.penCoordsIndex] = y1;
                        this.penCoordsIndex++;
                        this.penCoords[this.penCoordsIndex] = x2;
                        this.penCoordsIndex++;
                        this.penCoords[this.penCoordsIndex] = y2;
                        this.penCoordsIndex++;
                        this.penLines[this.penLinesIndex] = Math.PI / 2 + i / circleRes * Math.PI;
                        this.penLinesIndex++;
                        this.penLines[this.penLinesIndex] = size / 2;
                        this.penLinesIndex++;
                        this.penCoords[this.penCoordsIndex] = x1;
                        this.penCoordsIndex++;
                        this.penCoords[this.penCoordsIndex] = y1;
                        this.penCoordsIndex++;
                        this.penCoords[this.penCoordsIndex] = x2;
                        this.penCoordsIndex++;
                        this.penCoords[this.penCoordsIndex] = y2;
                        this.penCoordsIndex++;
                        this.penLines[this.penLinesIndex] = Math.PI / 2 + (i + 1) / circleRes * Math.PI;
                        this.penLinesIndex++;
                        this.penLines[this.penLinesIndex] = size / 2;
                        this.penLinesIndex++;
                    }
                    const [r, g, b, a] = color.toParts();
                    for (var i = 0; i < circleRes * 6 + 6; i++) {
                        this.penColors[this.penColorsIndex] = r;
                        this.penColorsIndex++;
                        this.penColors[this.penColorsIndex] = g;
                        this.penColorsIndex++;
                        this.penColors[this.penColorsIndex] = b;
                        this.penColorsIndex++;
                        this.penColors[this.penColorsIndex] = a;
                        this.penColorsIndex++;
                    }
                }
                penDot(color, size, x, y) {
                    const circleRes = this.getCircleResolution(size);
                    if (this.buffersCanFit(12 * circleRes)) {
                        this.drawPendingOperations();
                    }
                    for (var i = 1; i < circleRes; i++) {
                        this.penCoords[this.penCoordsIndex] = x;
                        this.penCoordsIndex++;
                        this.penCoords[this.penCoordsIndex] = y;
                        this.penCoordsIndex++;
                        this.penCoords[this.penCoordsIndex] = x;
                        this.penCoordsIndex++;
                        this.penCoords[this.penCoordsIndex] = x;
                        this.penCoordsIndex++;
                        this.penLines[this.penLinesIndex] = 0;
                        this.penLinesIndex++;
                        this.penLines[this.penLinesIndex] = 0;
                        this.penLinesIndex++;
                        this.penCoords[this.penCoordsIndex] = x;
                        this.penCoordsIndex++;
                        this.penCoords[this.penCoordsIndex] = y;
                        this.penCoordsIndex++;
                        this.penCoords[this.penCoordsIndex] = x + 1;
                        this.penCoordsIndex++;
                        this.penCoords[this.penCoordsIndex] = y + 1;
                        this.penCoordsIndex++;
                        this.penLines[this.penLinesIndex] = Math.PI / 2 + (i - 1) / circleRes * 2 * Math.PI;
                        this.penLinesIndex++;
                        this.penLines[this.penLinesIndex] = size / 2;
                        this.penLinesIndex++;
                        this.penCoords[this.penCoordsIndex] = x;
                        this.penCoordsIndex++;
                        this.penCoords[this.penCoordsIndex] = y;
                        this.penCoordsIndex++;
                        this.penCoords[this.penCoordsIndex] = x + 1;
                        this.penCoordsIndex++;
                        this.penCoords[this.penCoordsIndex] = y + 1;
                        this.penCoordsIndex++;
                        this.penLines[this.penLinesIndex] = Math.PI / 2 + i / circleRes * 2 * Math.PI;
                        this.penLinesIndex++;
                        this.penLines[this.penLinesIndex] = size / 2;
                        this.penLinesIndex++;
                    }
                    this.penCoords[this.penCoordsIndex] = x;
                    this.penCoordsIndex++;
                    this.penCoords[this.penCoordsIndex] = y;
                    this.penCoordsIndex++;
                    this.penCoords[this.penCoordsIndex] = x;
                    this.penCoordsIndex++;
                    this.penCoords[this.penCoordsIndex] = x;
                    this.penCoordsIndex++;
                    this.penLines[this.penLinesIndex] = 0;
                    this.penLinesIndex++;
                    this.penLines[this.penLinesIndex] = 0;
                    this.penLinesIndex++;
                    this.penCoords[this.penCoordsIndex] = x;
                    this.penCoordsIndex++;
                    this.penCoords[this.penCoordsIndex] = y;
                    this.penCoordsIndex++;
                    this.penCoords[this.penCoordsIndex] = x + 1;
                    this.penCoordsIndex++;
                    this.penCoords[this.penCoordsIndex] = y + 1;
                    this.penCoordsIndex++;
                    this.penLines[this.penLinesIndex] = Math.PI / 2 + (circleRes - 1) / circleRes * 2 * Math.PI;
                    this.penLinesIndex++;
                    this.penLines[this.penLinesIndex] = size / 2;
                    this.penLinesIndex++;
                    this.penCoords[this.penCoordsIndex] = x;
                    this.penCoordsIndex++;
                    this.penCoords[this.penCoordsIndex] = y;
                    this.penCoordsIndex++;
                    this.penCoords[this.penCoordsIndex] = x + 1;
                    this.penCoordsIndex++;
                    this.penCoords[this.penCoordsIndex] = y + 1;
                    this.penCoordsIndex++;
                    this.penLines[this.penLinesIndex] = Math.PI / 2;
                    this.penLinesIndex++;
                    this.penLines[this.penLinesIndex] = size / 2;
                    this.penLinesIndex++;
                    const [r, g, b, a] = color.toParts();
                    for (var i = 0; i < circleRes * 3; i++) {
                        this.penColors[this.penColorsIndex] = r;
                        this.penColorsIndex++;
                        this.penColors[this.penColorsIndex] = g;
                        this.penColorsIndex++;
                        this.penColors[this.penColorsIndex] = b;
                        this.penColorsIndex++;
                        this.penColors[this.penColorsIndex] = a;
                        this.penColorsIndex++;
                    }
                }
                penStamp(sprite) {
                    this.dirty = true;
                    if (this.pendingPenOperations()) {
                        this.drawPendingOperations();
                    }
                    this.useShader(this.allFiltersShader);
                    this.drawChild(sprite);
                }
                penClear() {
                    this.dirty = true;
                    this.penCoordsIndex = 0;
                    this.penLinesIndex = 0;
                    this.penColorsIndex = 0;
                    this.gl.clearColor(0, 0, 0, 0);
                    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
                }
            }
            PenRenderer.PEN_VERTEX_SHADER = `
    precision mediump float;

    // [0] = x1
    // [1] = y1
    // [2] = x2
    // [3] = y2
    attribute vec4 a_vertexData;
    // [0] = thickened vertex direction
    // [1] = thickened vertex distance
    attribute vec2 a_lineData;
    // [0] = red
    // [1] = green
    // [2] = blue
    // [3] = alpha
    attribute vec4 a_color;

    varying vec4 v_color;

    void main() {
      vec2 lineDir = normalize(a_vertexData.zw - a_vertexData.xy);

      mat2 rot;
      rot[0] = vec2(cos(a_lineData.x), sin(a_lineData.x));
      rot[1] = vec2(-sin(a_lineData.x), cos(a_lineData.x));

      lineDir *= rot * a_lineData.y;

      vec2 p = (a_vertexData.xy + lineDir);
      p.x /= 240.0;
      p.y /= 180.0;

      gl_Position = vec4(p, 0.0, 1.0);
      v_color = vec4(a_color.xyz / 255.0, a_color.w);
    }`;
            PenRenderer.PEN_FRAGMENT_SHADER = `
    precision mediump float;

    varying vec4 v_color;

    void main() {
      gl_FragColor = v_color;
    }`;
            class WebGLProjectRenderer extends WebGLSpriteRenderer {
                constructor(stage) {
                    super();
                    this.stage = stage;
                    this.zoom = 1;
                    this.collisionRenderer = new CollisionRenderer();
                    this.penRenderer = new PenRenderer();
                    this.fallbackRenderer = new P.renderer.canvas2d.ProjectRenderer2D(stage);
                }
                drawFrame() {
                    if (this.penRenderer.pendingPenOperations()) {
                        this.penRenderer.drawPendingOperations();
                    }
                    if (this.penRenderer.dirty) {
                        this.updatePenTexture();
                        this.penRenderer.dirty = false;
                    }
                    this.reset(this.zoom);
                    this.useShader(this.allFiltersShader);
                    this.drawChild(this.stage);
                    if (this.penTexture) {
                        this.drawTextureOverlay(this.penTexture);
                        this.useShader(this.allFiltersShader);
                    }
                    for (var i = 0; i < this.stage.children.length; i++) {
                        var child = this.stage.children[i];
                        if (!child.visible) {
                            continue;
                        }
                        this.drawChild(child);
                    }
                    this.gl.flush();
                }
                init(root) {
                    root.appendChild(this.canvas);
                }
                destroy() {
                    super.destroy();
                    this.penRenderer.destroy();
                    this.collisionRenderer.destroy();
                }
                onStageFiltersChanged() {
                }
                penLine(color, size, x1, y1, x2, y2) {
                    this.penRenderer.penLine(color, size, x1, y1, x2, y2);
                }
                penDot(color, size, x, y) {
                    this.penRenderer.penDot(color, size, x, y);
                }
                penStamp(sprite) {
                    this.penRenderer.penStamp(sprite);
                }
                penClear() {
                    this.penRenderer.penClear();
                }
                updatePenTexture() {
                    if (this.penTexture) {
                        this.gl.bindTexture(this.gl.TEXTURE_2D, this.penTexture);
                        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.penRenderer.canvas);
                    }
                    else {
                        this.penTexture = this.convertToTexture(this.penRenderer.canvas);
                    }
                }
                resize(scale) {
                    this.zoom = scale * P.config.scale;
                }
                spriteTouchesPoint(sprite, x, y) {
                    return this.collisionRenderer.spriteTouchesPoint(sprite, x, y);
                }
                spritesIntersect(spriteA, otherSprites) {
                    return this.collisionRenderer.spritesIntersect(spriteA, otherSprites);
                }
                spriteTouchesColor(sprite, color) {
                    return this.fallbackRenderer.spriteTouchesColor(sprite, color);
                }
                spriteColorTouchesColor(sprite, spriteColor, otherColor) {
                    return this.fallbackRenderer.spriteColorTouchesColor(sprite, spriteColor, otherColor);
                }
            }
            webgl.WebGLProjectRenderer = WebGLProjectRenderer;
        })(webgl = renderer.webgl || (renderer.webgl = {}));
    })(renderer = P.renderer || (P.renderer = {}));
})(P || (P = {}));
//# sourceMappingURL=phosphorus.dist.js.map