const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'prompt_versions', fields: ['prompt_name','version','content','perf_score','deployed'] });
