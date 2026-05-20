const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'evals', fields: ['project_name','name','eval_type','pass_rate','last_run'] });
