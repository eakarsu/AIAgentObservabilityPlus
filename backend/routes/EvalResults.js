const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'eval_results', fields: ['eval_name','sample_count','pass_count','fail_count','run_at'] });
