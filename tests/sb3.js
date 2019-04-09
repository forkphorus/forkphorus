/// <reference path="suite.js" />

/**
 * Hook into the compilers and add the suite methods.
 */
(function(compiler) {
  const originalProcedureCall = compiler.statementLibrary['procedures_call'];

  function getArguments(block) {
    var source = '';
    const mutation = block.mutation;
    const inputIds = JSON.parse(mutation.argumentids);
    for (const id of inputIds) {
      const input = block.inputs[id];
      source += compiler.hooks.expression(input) + ', ';
    }
    return source.substr(0, source.length - 2);
  }

  compiler.statementLibrary['procedures_call'] = function procedureCall(block) {
    switch (block.mutation.proccode) {
      case 'FAIL':
        compiler.hooks.appendSource('if (runtime.testFail("no message")) { return; }\n');
        break;

      case 'FAIL %s':
        compiler.hooks.appendSource('if (runtime.testFail(' + getArguments(block) + ' || "no message")) { return; }\n');
        break;

      case 'OKAY':
      case 'OK':
        compiler.hooks.appendSource('runtime.testOkay(""); return;\n');
        break;

      case 'OKAY %s':
      case 'OK %s':
        compiler.hooks.appendSource('runtime.testOkay(' + getArguments(block) + ' || ""); return;\n');
        break;

      default:
        originalProcedureCall(block);
    }
  };
}(P.sb3.compiler));

(function(suite) {
  suite.addProject('sb3/sb3-template.sb3', {

  });

  suite.addProject('sb3/quicksort.sb3', {

  });

  suite.addProject('sb3/befunge-eratosthenes.sb3', {

  });

  suite.addProject('sb3/string-functions.sb3', {

  });

  suite.addProject('sb3/operators.sb3', {

  });
}(P.suite));
