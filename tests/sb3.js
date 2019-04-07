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
        compiler.hooks.appendSource('suite.testFail("Project called FAIL");\n');
        compiler.hooks.appendSource('return;\n');
        break;

      case 'FAIL %s':
        compiler.hooks.appendSource('suite.testFail(' + getArguments(block) + ' || "Project called FAIL");\n');
        compiler.hooks.appendSource('return;\n');
        break;

      case 'OKAY':
      case 'OK':
        compiler.hooks.appendSource('suite.testOkay();\n');
        compiler.hooks.appendSource('return;\n');
        break;

      default:
        originalProcedureCall(block);
    }
  };
}(P.sb3.compiler));

suite.addProject('sb3/sb3-template.sb3', {

});
