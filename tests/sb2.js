/// <reference path="suite.js" />

(function(compiler) {
  const procedureOverrides = [
    'OK %s',
  ];

  const originalCompileListener = compiler.compileListener;
  compiler.compileListener = function compileListener(object, script) {
    const opcode = script[0][0];
    if (opcode !== 'procDef') {
      return originalCompileListener(object, script);
    }

    const proccode = script[0][1];
    if (procedureOverrides.includes(proccode)) {
      var source;
      switch (proccode) {
        case 'OK':
        case 'OKAY':
          source = 'runtime.testOkay("no message"); return;\n';
          break;

        case 'OK %s':
        case 'OKAY %s':
          source = 'runtime.testOkay(C.args[0]); return;\n';
          break;
        
        case 'FAIL':
          source = 'if (runtime.testFail("no message")) { return; }\n';
          break;

        case 'FAIL %s':
          source = 'if (runtime.testFail(C.args[1])) { return; }\n';
          break;
      }
      source += 'endCall();\n';
      const f = P.runtime.createContinuation(source);
      object.fns.push(f);
      object.procedures[proccode] = new compiler.Scratch2Procedure(f, false, []);
      return;
    }

    return originalCompileListener(object, script);
  };
}(P.sb2.compiler));

(function(addProject) {
  addProject('sb2/sb2-template.sb2');
}(P.suite.addProject));
