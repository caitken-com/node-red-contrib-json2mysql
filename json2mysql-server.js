const mysql = require('mysql');


/**
 * @description Connects to mysql server
 * @package json2mysql
 * @param {Object} RED
 * @author Christopher Aitken
 * @version 1.0
 */
module.exports = function(RED)
{
	function Json2mysqlServerNode(config)
	{
		RED.nodes.createNode(this, config);

		const node = this;

		node.host = config.host;
		node.database = config.database;
		node.user = config.user;
		node.password = config.password;


		node.query = function query(query)
		{
			return new Promise((resolve, reject) =>
			{
				let connection;

				try
				{
					connection = mysql.createConnection(
					{
						host: node.host,
						user: node.user,
						password: node.password,
						database: node.database,
					});

					connection.query(query, (error, results, fields) =>
					{
						connection.end();

						if (error) return reject(error);

						resolve({
							payload: results,
							insertId: ('insertId' in results) ? results.insertId : null,
							affectedRows: ('affectedRows' in results) ? results.affectedRows : null,
							changedRows: ('changedRows' in results) ? results.changedRows : null,
						});
					});
				}
				catch(error)
				{
					reject(error);
				}
			});
		}
	}

	RED.nodes.registerType("json2mysql-server", Json2mysqlServerNode);
}
