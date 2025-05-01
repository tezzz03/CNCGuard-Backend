const { PythonShell } = require('python-shell');
const path = require('path');

const predictRisk = async (dataPoint) => {
  return new Promise((resolve, reject) => {
    const options = {
      mode: 'json',
      pythonOptions: ['-u'],
      scriptPath: path.join(__dirname, '../ai'),
      args: [JSON.stringify(dataPoint)],
    };

    PythonShell.run('predict.py', options, (err, results) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};

module.exports = { predictRisk };