const buildCrud = require('./_crudFactory');
module.exports = buildCrud({ table: 'prompts', fields: ['project_name','name','version','model','perf_score'] });
