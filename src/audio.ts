/// <reference path="phosphorus.ts" />
/// <reference path="config.ts" />

namespace P.audio {
  export const context = (function(): AudioContext | null {
    if ((window as any).AudioContext) {
      return new AudioContext();
    } else if ((window as any).webkitAudioContext) {
      return new (window as any).webkitAudioContext();
    } else {
      return null;
    }
  })();

  if (context) {
    // TODO: customizable volume
    var volume = 0.5;
    var globalNode = context.createGain();
    globalNode.gain.value = volume;
    globalNode.connect(context.destination);
  }

  // Most things relating to Span are old things I don't understand and don't want to touch.
  interface Span {
    name: string;
    loop: boolean;
    loopStart: number | null;
    loopEnd: number | null;
    baseRatio: number;
    attackEnd: number;
    holdEnd: number;
    decayEnd: number;
    decayTime?: number;
    top?: number;
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
  export const drums: Span[] = [
    {name:'SnareDrum',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'Tom',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'SideStick',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'Crash',baseRatio:0.8908987181403393,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'HiHatOpen',baseRatio:0.9438743126816935,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'HiHatClosed',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'Tambourine',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'Clap',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'Claves',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'WoodBlock',baseRatio:0.7491535384383408,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'Cowbell',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'Triangle',baseRatio:0.8514452780229479,loop:true,loopStart:0.7638548752834468,loopEnd:0.7825396825396825,attackEnd:0,holdEnd:0,decayEnd:2},
    {name:'Bongo',baseRatio:0.5297315471796477,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'Conga',baseRatio:0.7954545454545454,loop:true,loopStart:0.1926077097505669,loopEnd:0.20403628117913833,attackEnd:0,holdEnd:0,decayEnd:2},
    {name:'Cabasa',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'GuiroLong',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'Vibraslap',baseRatio:0.8408964152537145,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},
    {name:'Cuica',baseRatio:0.7937005259840998,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0}
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
  export const instruments: Span[][] = [
    [
      {top:38,name:'AcousticPiano_As3',baseRatio:0.5316313272700484,loop:true,loopStart:0.465578231292517,loopEnd:0.7733786848072562,attackEnd:0,holdEnd:0.1,decayEnd:22.1},
      {top:44,name:'AcousticPiano_C4',baseRatio:0.5905141892259927,loop:true,loopStart:0.6334693877551021,loopEnd:0.8605442176870748,attackEnd:0,holdEnd:0.1,decayEnd:20.1},
      {top:51,name:'AcousticPiano_G4',baseRatio:0.8843582887700535,loop:true,loopStart:0.5532879818594104,loopEnd:0.5609977324263039,attackEnd:0,holdEnd:0.08,decayEnd:18.08},
      {top:62,name:'AcousticPiano_C6',baseRatio:2.3557692307692304,loop:true,loopStart:0.5914739229024943,loopEnd:0.6020861678004535,attackEnd:0,holdEnd:0.08,decayEnd:16.08},
      {top:70,name:'AcousticPiano_F5',baseRatio:1.5776515151515151,loop:true,loopStart:0.5634920634920635,loopEnd:0.5879818594104308,attackEnd:0,holdEnd:0.04,decayEnd:14.04},
      {top:77,name:'AcousticPiano_Ds6',baseRatio:2.800762112139358,loop:true,loopStart:0.560907029478458,loopEnd:0.5836281179138322,attackEnd:0,holdEnd:0.02,decayEnd:10.02},
      {top:85,name:'AcousticPiano_Ds6',baseRatio:2.800762112139358,loop:true,loopStart:0.560907029478458,loopEnd:0.5836281179138322,attackEnd:0,holdEnd:0,decayEnd:8},
      {top:90,name:'AcousticPiano_Ds6',baseRatio:2.800762112139358,loop:true,loopStart:0.560907029478458,loopEnd:0.5836281179138322,attackEnd:0,holdEnd:0,decayEnd:6},
      {top:96,name:'AcousticPiano_D7',baseRatio:5.275119617224881,loop:true,loopStart:0.3380498866213152,loopEnd:0.34494331065759637,attackEnd:0,holdEnd:0,decayEnd:3},
      {top:128,name:'AcousticPiano_D7',baseRatio:5.275119617224881,loop:true,loopStart:0.3380498866213152,loopEnd:0.34494331065759637,attackEnd:0,holdEnd:0,decayEnd:2}
    ], [
      {top:48,name:'ElectricPiano_C2',baseRatio:0.14870515241435123,loop:true,loopStart:0.6956009070294784,loopEnd:0.7873015873015873,attackEnd:0,holdEnd:0.08,decayEnd:10.08},
      {top:74,name:'ElectricPiano_C4',baseRatio:0.5945685670261941,loop:true,loopStart:0.5181859410430839,loopEnd:0.5449433106575964,attackEnd:0,holdEnd:0.04,decayEnd:8.04},
      {top:128,name:'ElectricPiano_C4',baseRatio:0.5945685670261941,loop:true,loopStart:0.5181859410430839,loopEnd:0.5449433106575964,attackEnd:0,holdEnd:0,decayEnd:6}
    ], [
      {top:128,name:'Organ_G2',baseRatio:0.22283731584620914,loop:true,loopStart:0.05922902494331066,loopEnd:0.1510204081632653,attackEnd:0,holdEnd:0,decayEnd:0}
    ],[{top:40,name:'AcousticGuitar_F3',baseRatio:0.3977272727272727,loop:true,loopStart:1.6628117913832199,loopEnd:1.6685260770975057,attackEnd:0,holdEnd:0,decayEnd:15},
      {top:56,name:'AcousticGuitar_F3',baseRatio:0.3977272727272727,loop:true,loopStart:1.6628117913832199,loopEnd:1.6685260770975057,attackEnd:0,holdEnd:0,decayEnd:13.5},
      {top:60,name:'AcousticGuitar_F3',baseRatio:0.3977272727272727,loop:true,loopStart:1.6628117913832199,loopEnd:1.6685260770975057,attackEnd:0,holdEnd:0,decayEnd:12},
      {top:67,name:'AcousticGuitar_F3',baseRatio:0.3977272727272727,loop:true,loopStart:1.6628117913832199,loopEnd:1.6685260770975057,attackEnd:0,holdEnd:0,decayEnd:8.5},
      {top:72,name:'AcousticGuitar_F3',baseRatio:0.3977272727272727,loop:true,loopStart:1.6628117913832199,loopEnd:1.6685260770975057,attackEnd:0,holdEnd:0,decayEnd:7},
      {top:83,name:'AcousticGuitar_F3',baseRatio:0.3977272727272727,loop:true,loopStart:1.6628117913832199,loopEnd:1.6685260770975057,attackEnd:0,holdEnd:0,decayEnd:5.5},
      {top:128,name:'AcousticGuitar_F3',baseRatio:0.3977272727272727,loop:true,loopStart:1.6628117913832199,loopEnd:1.6685260770975057,attackEnd:0,holdEnd:0,decayEnd:4.5}
    ], [
      {top:40,name:'ElectricGuitar_F3',baseRatio:0.39615522817103843,loop:true,loopStart:1.5733333333333333,loopEnd:1.5848072562358,attackEnd:0,holdEnd:0,decayEnd:15},
      {top:56,name:'ElectricGuitar_F3',baseRatio:0.39615522817103843,loop:true,loopStart:1.5733333333333333,loopEnd:1.5848072562358277,attackEnd:0,holdEnd:0,decayEnd:13.5},
      {top:60,name:'ElectricGuitar_F3',baseRatio:0.39615522817103843,loop:true,loopStart:1.5733333333333333,loopEnd:1.5848072562358277,attackEnd:0,holdEnd:0,decayEnd:12},
      {top:67,name:'ElectricGuitar_F3',baseRatio:0.39615522817103843,loop:true,loopStart:1.5733333333333333,loopEnd:1.5848072562358277,attackEnd:0,holdEnd:0,decayEnd:8.5},
      {top:72,name:'ElectricGuitar_F3',baseRatio:0.39615522817103843,loop:true,loopStart:1.5733333333333333,loopEnd:1.5848072562358277,attackEnd:0,holdEnd:0,decayEnd:7},
      {top:83,name:'ElectricGuitar_F3',baseRatio:0.39615522817103843,loop:true,loopStart:1.5733333333333333,loopEnd:1.5848072562358277,attackEnd:0,holdEnd:0,decayEnd:5.5},
      {top:128,name:'ElectricGuitar_F3',baseRatio:0.39615522817103843,loop:true,loopStart:1.5733333333333333,loopEnd:1.5848072562358277,attackEnd:0,holdEnd:0,decayEnd:4.5}
    ], [
      {top:34,name:'ElectricBass_G1',baseRatio:0.11111671034065712,loop:true,loopStart:1.9007709750566892,loopEnd:1.9212244897959183,attackEnd:0,holdEnd:0,decayEnd:17},
      {top:48,name:'ElectricBass_G1',baseRatio:0.11111671034065712,loop:true,loopStart:1.9007709750566892,loopEnd:1.9212244897959183,attackEnd:0,holdEnd:0,decayEnd:14},
      {top:64,name:'ElectricBass_G1',baseRatio:0.11111671034065712,loop:true,loopStart:1.9007709750566892,loopEnd:1.9212244897959183,attackEnd:0,holdEnd:0,decayEnd:12},
      {top:128,name:'ElectricBass_G1',baseRatio:0.11111671034065712,loop:true,loopStart:1.9007709750566892,loopEnd:1.9212244897959183,attackEnd:0,holdEnd:0,decayEnd:10}
    ], [
      {top:38,name:'Pizz_G2',baseRatio:0.21979665071770335,loop:true,loopStart:0.3879365079365079,loopEnd:0.3982766439909297,attackEnd:0,holdEnd:0,decayEnd:5},
      {top:45,name:'Pizz_G2',baseRatio:0.21979665071770335,loop:true,loopStart:0.3879365079365079,loopEnd:0.3982766439909297,attackEnd:0,holdEnd:0.012,decayEnd:4.012},
      {top:56,name:'Pizz_A3',baseRatio:0.503654636820466,loop:true,loopStart:0.5197278911564626,loopEnd:0.5287528344671202,attackEnd:0,holdEnd:0,decayEnd:4},
      {top:64,name:'Pizz_A3',baseRatio:0.503654636820466,loop:true,loopStart:0.5197278911564626,loopEnd:0.5287528344671202,attackEnd:0,holdEnd:0,decayEnd:3.2},
      {top:72,name:'Pizz_E4',baseRatio:0.7479647218453188,loop:true,loopStart:0.7947845804988662,loopEnd:0.7978231292517007,attackEnd:0,holdEnd:0,decayEnd:2.8},
      {top:80,name:'Pizz_E4',baseRatio:0.7479647218453188,loop:true,loopStart:0.7947845804988662,loopEnd:0.7978231292517007,attackEnd:0,holdEnd:0,decayEnd:2.2},
      {top:128,name:'Pizz_E4',baseRatio:0.7479647218453188,loop:true,loopStart:0.7947845804988662,loopEnd:0.7978231292517007,attackEnd:0,holdEnd:0,decayEnd:1.5}
    ], [
      {top:41,name:'Cello_C2',baseRatio:0.14870515241435123,loop:true,loopStart:0.3876643990929705,loopEnd:0.40294784580498866,attackEnd:0,holdEnd:0,decayEnd:0},
      {top:52,name:'Cello_As2',baseRatio:0.263755980861244,loop:true,loopStart:0.3385487528344671,loopEnd:0.35578231292517004,attackEnd:0,holdEnd:0,decayEnd:0},
      {top:62,name:'Violin_D4',baseRatio:0.6664047388781432,loop:true,loopStart:0.48108843537414964,loopEnd:0.5151927437641723,attackEnd:0,holdEnd:0,decayEnd:0},
      {top:75,name:'Violin_A4',baseRatio:0.987460815047022,loop:true,loopStart:0.14108843537414967,loopEnd:0.15029478458049886,attackEnd:0.07,holdEnd:0.07,decayEnd:0.07},
      {top:128,name:'Violin_E5',baseRatio:1.4885238523852387,loop:true,loopStart:0.10807256235827664,loopEnd:0.1126530612244898,attackEnd:0,holdEnd:0,decayEnd:0}
    ], [
      {top:30,name:'BassTrombone_A2_3',baseRatio:0.24981872564125807,loop:true,loopStart:0.061541950113378686,loopEnd:0.10702947845804989,attackEnd:0,holdEnd:0,decayEnd:0},
      {top:40,name:'BassTrombone_A2_2',baseRatio:0.24981872564125807,loop:true,loopStart:0.08585034013605441,loopEnd:0.13133786848072562,attackEnd:0,holdEnd:0,decayEnd:0},
      {top:55,name:'Trombone_B3',baseRatio:0.5608240680183126,loop:true,loopStart:0.12,loopEnd:0.17673469387755103,attackEnd:0,holdEnd:0,decayEnd:0},
      {top:88,name:'Trombone_B3',baseRatio:0.5608240680183126,loop:true,loopStart:0.12,loopEnd:0.17673469387755103,attackEnd:0.05,holdEnd:0.05,decayEnd:0.05},
      {top:128,name:'Trumpet_E5',baseRatio:1.4959294436906376,loop:true,loopStart:0.1307936507936508,loopEnd:0.14294784580498865,attackEnd:0,holdEnd:0,decayEnd:0}
    ], [
      {top:128,name:'Clarinet_C4',baseRatio:0.5940193965517241,loop:true,loopStart:0.6594104308390023,loopEnd:0.7014965986394558,attackEnd:0,holdEnd:0,decayEnd:0}
    ], [
      {top:40,name:'TenorSax_C3',baseRatio:0.2971698113207547,loop:true,loopStart:0.4053968253968254,loopEnd:0.4895238095238095,attackEnd:0,holdEnd:0,decayEnd:0},
      {top:50,name:'TenorSax_C3',baseRatio:0.2971698113207547,loop:true,loopStart:0.4053968253968254,loopEnd:0.4895238095238095,attackEnd:0.02,holdEnd:0.02,decayEnd:0.02},
      {top:59,name:'TenorSax_C3',baseRatio:0.2971698113207547,loop:true,loopStart:0.4053968253968254,loopEnd:0.4895238095238095,attackEnd:0.04,holdEnd:0.04,decayEnd:0.04},
      {top:67,name:'AltoSax_A3',baseRatio:0.49814747876378096,loop:true,loopStart:0.3875736961451247,loopEnd:0.4103854875283447,attackEnd:0,holdEnd:0,decayEnd:0},
      {top:75,name:'AltoSax_A3',baseRatio:0.49814747876378096,loop:true,loopStart:0.3875736961451247,loopEnd:0.4103854875283447,attackEnd:0.02,holdEnd:0.02,decayEnd:0.02},
      {top:80,name:'AltoSax_A3',baseRatio:0.49814747876378096,loop:true,loopStart:0.3875736961451247,loopEnd:0.4103854875283447,attackEnd:0.02,holdEnd:0.02,decayEnd:0.02},
      {top:128,name:'AltoSax_C6',baseRatio:2.3782742681047764,loop:true,loopStart:0.05705215419501134,loopEnd:0.0838095238095238,attackEnd:0,holdEnd:0,decayEnd:0}
    ], [
      {top:61,name:'Flute_B5_2',baseRatio:2.255113636363636,loop:true,loopStart:0.08430839002267573,loopEnd:0.10244897959183673,attackEnd:0,holdEnd:0,decayEnd:0},
      {top:128,name:'Flute_B5_1',baseRatio:2.255113636363636,loop:true,loopStart:0.10965986394557824,loopEnd:0.12780045351473923,attackEnd:0,holdEnd:0,decayEnd:0}
    ], [
      {top:128,name:'WoodenFlute_C5',baseRatio:1.1892952324548416,loop:true,loopStart:0.5181859410430839,loopEnd:0.7131065759637188,attackEnd:0,holdEnd:0,decayEnd:0}
    ], [
      {top:57,name:'Bassoon_C3',baseRatio:0.29700969827586204,loop:true,loopStart:0.11011337868480725,loopEnd:0.19428571428571428,attackEnd:0,holdEnd:0,decayEnd:0},
      {top:67,name:'Bassoon_C3',baseRatio:0.29700969827586204,loop:true,loopStart:0.11011337868480725,loopEnd:0.19428571428571428,attackEnd:0.04,holdEnd:0.04,decayEnd:0.04},
      {top:76,name:'Bassoon_C3',baseRatio:0.29700969827586204,loop:true,loopStart:0.11011337868480725,loopEnd:0.19428571428571428,attackEnd:0.08,holdEnd:0.08,decayEnd:0.08},
      {top:84,name:'EnglishHorn_F3',baseRatio:0.39601293103448276,loop:true,loopStart:0.341859410430839,loopEnd:0.4049886621315193,attackEnd:0.04,holdEnd:0.04,decayEnd:0.04},
      {top:128,name:'EnglishHorn_D4',baseRatio:0.6699684005833739,loop:true,loopStart:0.22027210884353743,loopEnd:0.23723356009070296,attackEnd:0,holdEnd:0,decayEnd:0}
    ], [
      {top:39,name:'Choir_F3',baseRatio:0.3968814788643197,loop:true,loopStart:0.6352380952380953,loopEnd:1.8721541950113378,attackEnd:0,holdEnd:0,decayEnd:0},
      {top:50,name:'Choir_F3',baseRatio:0.3968814788643197,loop:true,loopStart:0.6352380952380953,loopEnd:1.8721541950113378,attackEnd:0.04,holdEnd:0.04,decayEnd:0.04},
      {top:61,name:'Choir_F3',baseRatio:0.3968814788643197,loop:true,loopStart:0.6352380952380953,loopEnd:1.8721541950113378,attackEnd:0.06,holdEnd:0.06,decayEnd:0.06},
      {top:72,name:'Choir_F4',baseRatio:0.7928898424161845,loop:true,loopStart:0.7415419501133786,loopEnd:2.1059410430839,attackEnd:0,holdEnd:0,decayEnd:0},
      {top:128,name:'Choir_F5',baseRatio:1.5879576065654504,loop:true,loopStart:0.836281179138322,loopEnd:2.0585487528344673,attackEnd:0,holdEnd:0,decayEnd:0}
    ], [
      {top:38,name:'Vibraphone_C3',baseRatio:0.29829545454545453,loop:true,loopStart:0.2812698412698413,loopEnd:0.28888888888888886,attackEnd:0,holdEnd:0.1,decayEnd:8.1},
      {top:48,name:'Vibraphone_C3',baseRatio:0.29829545454545453,loop:true,loopStart:0.2812698412698413,loopEnd:0.28888888888888886,attackEnd:0,holdEnd:0.1,decayEnd:7.6},
      {top:59,name:'Vibraphone_C3',baseRatio:0.29829545454545453,loop:true,loopStart:0.2812698412698413,loopEnd:0.28888888888888886,attackEnd:0,holdEnd:0.06,decayEnd:7.06},
      {top:70,name:'Vibraphone_C3',baseRatio:0.29829545454545453,loop:true,loopStart:0.2812698412698413,loopEnd:0.28888888888888886,attackEnd:0,holdEnd:0.04,decayEnd:6.04},
      {top:78,name:'Vibraphone_C3',baseRatio:0.29829545454545453,loop:true,loopStart:0.2812698412698413,loopEnd:0.28888888888888886,attackEnd:0,holdEnd:0.02,decayEnd:5.02},
      {top:86,name:'Vibraphone_C3',baseRatio:0.29829545454545453,loop:true,loopStart:0.2812698412698413,loopEnd:0.28888888888888886,attackEnd:0,holdEnd:0,decayEnd:4},
      {top:128,name:'Vibraphone_C3',baseRatio:0.29829545454545453,loop:true,loopStart:0.2812698412698413,loopEnd:0.28888888888888886,attackEnd:0,holdEnd:0,decayEnd:3}
    ], [
      {top:128,name:'MusicBox_C4',baseRatio:0.5937634640241276,loop:true,loopStart:0.6475283446712018,loopEnd:0.6666666666666666,attackEnd:0,holdEnd:0,decayEnd:2}
    ], [
      {top:128,name:'SteelDrum_D5',baseRatio:1.3660402567543959,loop:false,loopStart:-0.000045351473922902495,loopEnd:-0.000045351473922902495,attackEnd:0,holdEnd:0,decayEnd:2}
    ],[
      {top:128,name:'Marimba_C4',baseRatio:0.5946035575013605,loop:false,loopStart:-0.000045351473922902495,loopEnd:-0.000045351473922902495,attackEnd:0,holdEnd:0,decayEnd:0}
    ], [
      {top:80,name:'SynthLead_C4',baseRatio:0.5942328422565577,loop:true,loopStart:0.006122448979591836,loopEnd:0.06349206349206349,attackEnd:0,holdEnd:0,decayEnd:0},
      {top:128,name:'SynthLead_C6',baseRatio:2.3760775862068964,loop:true,loopStart:0.005623582766439909,loopEnd:0.01614512471655329,attackEnd:0,holdEnd:0,decayEnd:0}
    ], [
      {top:38,name:'SynthPad_A3',baseRatio:0.4999105065330231,loop:true,loopStart:0.1910204081632653,loopEnd:3.9917006802721087,attackEnd:0.05,holdEnd:0.05,decayEnd:0.05},
      {top:50,name:'SynthPad_A3',baseRatio:0.4999105065330231,loop:true,loopStart:0.1910204081632653,loopEnd:3.9917006802721087,attackEnd:0.08,holdEnd:0.08,decayEnd:0.08},
      {top:62,name:'SynthPad_A3',baseRatio:0.4999105065330231,loop:true,loopStart:0.1910204081632653,loopEnd:3.9917006802721087,attackEnd:0.11,holdEnd:0.11,decayEnd:0.11},
      {top:74,name:'SynthPad_A3',baseRatio:0.4999105065330231,loop:true,loopStart:0.1910204081632653,loopEnd:3.9917006802721087,attackEnd:0.15,holdEnd:0.15,decayEnd:0.15},
      {top:86,name:'SynthPad_A3',baseRatio:0.4999105065330231,loop:true,loopStart:0.1910204081632653,loopEnd:3.9917006802721087,attackEnd:0.2,holdEnd:0.2,decayEnd:0.2},
      {top:128,name:'SynthPad_C6',baseRatio:2.3820424708835755,loop:true,loopStart:0.11678004535147392,loopEnd:0.41732426303854875,attackEnd:0,holdEnd:0,decayEnd:0}
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
  const soundbank: {[s: string]: AudioBuffer} = {};

  /**
   * Loads missing soundbank files, if any.
   */
  export function loadSoundbankSB2(loader?: P.io.Loader): Promise<any> {
    if (!context) return Promise.resolve();

    const promises: Promise<unknown>[] = [];
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

  /**
   * Loads a soundbank file
   */
  function loadSoundbankBuffer(name: string): Promise<AudioBuffer> {
    return P.io.getAssetManager().loadSoundbankFile(SB2_SOUNDBANK_FILES[name])
      .then((buffer) => P.audio.decodeAudio(buffer))
      .then((sound) => soundbank[name] = sound);
  }

  export function playSpan(span: Span, key: number, duration: number, connection: AudioNode): AudioNode {
    if (!context) {
      throw new Error('Cannot playSpan without an AudioContext');
    }

    const buffer = soundbank[span.name];
    if (!buffer) {
      throw new Error('No soundbank entry named: ' + span.name);
    }

    const source = context.createBufferSource();
    const note = context.createGain();

    source.buffer = buffer;
    if (source.loop = span.loop) {
      source.loopStart = span.loopStart as number;
      source.loopEnd = span.loopEnd as number;
    }

    source.connect(note);
    note.connect(connection);

    const time = context.currentTime;
    source.playbackRate.value = Math.pow(2, (key - 69) / 12) / span.baseRatio;

    const gain = note.gain;
    gain.value = 0;
    gain.setValueAtTime(0, time);
    if (span.attackEnd < duration) {
      gain.linearRampToValueAtTime(1, time + span.attackEnd);
      if ((span.decayTime as any) > 0 && span.holdEnd < duration) {
        gain.linearRampToValueAtTime(1, time + span.holdEnd);
        if (span.decayEnd < duration) {
          gain.linearRampToValueAtTime(0, time + span.decayEnd);
        } else {
          gain.linearRampToValueAtTime(1 - (duration - span.holdEnd) / span.decayTime!, time + duration);
        }
      } else {
        gain.linearRampToValueAtTime(1, time + duration);
      }
    } else {
      gain.linearRampToValueAtTime(1, time + duration);
    }
    gain.linearRampToValueAtTime(0, time + duration + 0.02267573696);

    source.start(time);
    source.stop(time + duration + 0.02267573696);
    return source;
  }

  /**
   * Connect an audio node
   */
  export function connectNode(node: AudioNode) {
    node.connect(globalNode);
  }

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

  function decodeADPCMAudio(ab: ArrayBuffer, cb) {
    var dv = new DataView(ab);
    if (dv.getUint32(0) !== 0x52494646 || dv.getUint32(8) !== 0x57415645) {
      return cb(new Error('Unrecognized audio format'));
    }

    var blocks: ObjectMap<number> = {};
    var i = 12, l = dv.byteLength - 8;
    while (i < l) {
      blocks[String.fromCharCode(
        dv.getUint8(i),
        dv.getUint8(i + 1),
        dv.getUint8(i + 2),
        dv.getUint8(i + 3))] = i;
      i += 8 + dv.getUint32(i + 4, true);
    }

    var format        = dv.getUint16(20, true);
    var channels      = dv.getUint16(22, true);
    var sampleRate    = dv.getUint32(24, true);
    var byteRate      = dv.getUint32(28, true);
    var blockAlign    = dv.getUint16(32, true);
    var bitsPerSample = dv.getUint16(34, true);

    if (format === 17) {
      var samplesPerBlock = dv.getUint16(38, true);
      var blockSize = ((samplesPerBlock - 1) / 2) + 4;

      var frameCount = dv.getUint32(blocks.fact + 8, true);

      var buffer = context!.createBuffer(1, frameCount, sampleRate);
      var channel = buffer.getChannelData(0);

      var sample, index = 0;
      var step, code, delta;
      var lastByte = -1;

      var offset = blocks.data + 8;
      i = offset;
      var j = 0;
      while (true) {
        if ((((i - offset) % blockSize) == 0) && (lastByte < 0)) {
          if (i >= dv.byteLength) break;
          sample = dv.getInt16(i, true); i += 2;
          index = dv.getUint8(i); i += 1;
          i++;
          if (index > 88) index = 88;
          channel[j++] = sample / 32767;
        } else {
          if (lastByte < 0) {
            if (i >= dv.byteLength) break;
            lastByte = dv.getUint8(i); i += 1;
            code = lastByte & 0xf;
          } else {
            code = (lastByte >> 4) & 0xf;
            lastByte = -1;
          }
          step = ADPCM_STEPS[index];
          delta = 0;
          if (code & 4) delta += step;
          if (code & 2) delta += step >> 1;
          if (code & 1) delta += step >> 2;
          delta += step >> 3;
          index += ADPCM_INDEX[code];
          if (index > 88) index = 88;
          if (index < 0) index = 0;
          sample += (code & 8) ? -delta : delta;
          if (sample > 32767) sample = 32767;
          if (sample < -32768) sample = -32768;
          channel[j++] = sample / 32768;
        }
      }
      return cb(null, buffer);
    }
    cb(new Error('Unrecognized WAV format ' + format));
  }

  export function decodeAudio(ab: ArrayBuffer): Promise<AudioBuffer> {
    if (!context) {
      return Promise.reject(new Error('No audio context'));
    }

    return new Promise((resolve, reject) => {
      decodeADPCMAudio(ab, function(err1: any, buffer: AudioBuffer) {
        if (buffer) {
          resolve(buffer);
          return;
        }

        // Hope that the audio context will know what to do
        audio.context!.decodeAudioData(ab, function(buffer) {
          resolve(buffer);
        }, function(err2) {
          reject(`Could not decode audio: ${err1} | ${err2}`);
        });
      });
    });
  }
}
