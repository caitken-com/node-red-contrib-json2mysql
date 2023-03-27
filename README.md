# JSON 2 MySQL for NodeRed

Takes JSON payloads which then creates and executes MySQL queries, that are sql injection safe, with automatic quoting for input params, and`table`.`column` back-ticking.

Although json might seem a bit more bloated than straight sql strings, I believe having the payloads like this allows for better readability and flexibility. Eg: generating the conditions on the fly.

## Dependencies
### NodeJS MySQL:
`$ npm install mysql`
https://www.npmjs.com/package/mysql
### MySQL server:
Here's an example tutorial on installing for Raspberry Pi, but you do you....
https://linuxhint.com/setup-mysql-raspberry-pi/
### Some prior knowledge of SQL syntax:
Although I've changed certain keywords to simplify the json, some prior knowledge is beneficial.
## Config node
Create a config node to connect to your database server
**host**  `domain|IP|localhost`
**database** Name of database to connect
**user** Username to database
**password** Password to database
## Query node
This is the node you'll use in your flows to pass in JSON and receive `string|array|object` from the output.
**name**  [optional] Node label
**server** Config node used for database connection.
**template** [optional] JSON string to create static payloads. Input payload can override/appended via input payload.
Example template:
```
{
	"select": {
		"table": {"users": "user"},
		"columns": [
			"user.*"
		]
	}
	"where": [
		["user.first_name", "=", "?:first_name"]
	]
}
```
Example input payload to append to the template:
```
{
	"params": {
		"first_name": "John"
	}
}
```
Example input payload to override (where clause) of the template, the rest of the template will remain unchanged:
```
{
	"where": [
		["user.first_name", "is not", null]
	]
}
```
## Supported query types
Currently supports the following query types:
- SELECT
- INSERT
- DELETE
- UPDATE

Use lowercase keywords within your json. Eg: `select`, not ~~SELECT~~. Optional keywords to use with the above query types: `joins`,`where`,`having`,`order`,`group`,`limit`,`params`,`return`

Currently only supports one query at a time. A full example is at the bottom of this page.
## Payload keywords:
### `select` keyword must have the following:
**table** Either _string_  `table_name`, or `{"table_name":"alias"}`  _object_.
**columns**  _array_ of strings. Best practice to use `alias.column` identifiers.
```
"select": {
	"table": {"users": "user"}
	"columns: [
		"user.first_name",
		"YEAR(user.date_added) AS year_added",
		"salery.amount",
	]
},
```
### `insert` keyword must have the following:
**table**  _string_  `table name`
**columns**  _object_ of `"column":"value"`pairs. See `params` for injection safe values.
**duplicates** [Optional] _array_ of strings. Adds `ON DUPLICATE KEY UPDATE ...` statement.
```
"insert": {
	"table": "users",
	"columns": {
		"id": 10,
		"date_added": "NOW()",
		"first_name": "?"
	},
	"duplicates": [
		"id = id + 1"
	]
},
```
### `delete` keyword must have the following:
**table** Either _string_  `table_name`, or `{"table_name":"alias"}`  _object_.
```
"delete": {
	"table": {"users": "user"}
},
```
### `update` keyword must have the following:
**table** Either _string_  `table_name`, or `{"table_name":"alias"}`  _object_.
**columns**  _object_ of `"table.column":"value"`pairs. See `params` for injection safe values.
```
"update": {
	"table": {"users": "user"},
	"columns": {
		"user.first_name": "?",
		"user.date_modified": "NOW()"
	}
},
```
### `joins` keyword must have the following:
An _array_ of objects, each with:
**type**  _string_  `inner|left|right|cross`
**table** Either _string_  `table_name`, or `{"table_name":"alias"}`  _object_.
**conditions** An _array_ of arrays, each being `[column, operator, value]` See `where` for all _operators_.
```
"joins": [
	{
		"type": "inner",
		"table": {"salaries":"salary"},
		"conditions": [
			["salary.user_id", "=", "user.id"]
		]
	},
	{
		"type": "left",
		"table": {"attendances":"attendance"},
		"conditions": [
			["attendance.user_id", "=", "user.id"]
		]
	}
],
```
### `where` keyword:
_array_ of arrays, each being `[column, operator, value]`. See `params` for implementing injection safe values.
See `Operators` for possible conditions. `value` can be `null|bool|number|string`
```
"where": [
	["user.active", "=", true],
	["YEAR(user.date_added)", ">", "?"],
	["user.first_name", "is", null],
	["user.date_modified", "BETWEEN", ["?", "?"]],
	["user.age", "in", [20,21,22,23]],
	["user.last_name", "contains", "?"],
	["user.last_name", "begins", "?"],
	["user.last_name", "ends", "?"],
],
```
#### Operators:
`=` Equals.
`<=`Less than or equals.
`>=` More than or equals.
`<` Less than.
`>` More than.
`!=` Not equal.
`<>` Not equal.
`is`  _Typically used with value of_  `null`.
`is not`  _Typically used with value of_  `null`.
`between` Value must be an _array_ of `["start", "end"]` values.
`in` Value must be an _array_  `["x","y","z"]`.
`not in` Value must be an _array_`["x","y","z"]`.
`contains` Performs a `LIKE` condition in which column value _contains_ given value `value`.
`begins` Performs a `LIKE` condition in which the column value _starts_ with given `value`.
`ends` Performs a `LIKE` conditions in which the column value _ends_ with given `value`.
### `having` keyword:
_array_ of arrays, each being `[column, operator, value]`. See `where` for more information.
```
"having": [
	["total", ">", 100]
],
```
### `params` keyword:
Either `array` of strings, or `{"name":"value"}`  _object_.
These will replace the `?` placeholders, matching the order of each occurrence.
```
"where": [
	["user.first_name", '=', "?"],
	["user.last_name", '=', "?"],
	["user.gender", '=', "?"],
],
"params": [
	"John",
	"Smith",
	"Male"
],
```
These will replace the _named_ placeholders, eg: `?:first_name`. Useful for multiple occurrences of that input. Ordering is ignored.
```
"where": [
	["user.first_name", '=', "?:first_name"],
	["user.last_name", '=', "?:last_name"],
	["user.gender", '=', "?:gender"],
],
"params": {
	"first_name": "John",
	"last_name": "Smith",
	"gender": "Male"
},
```
### `order` keyword:
Either array of _strings_, or `{"column":"asc|desc"}`  _object(s)_.
```
"order": [
	"user.first_name",
	{"user.first_name": "desc"},
],
```
### `group` keyword:
Array of _strings_.
```
"group": [
	"user.age",
	"user.gender",
]
```
### `limit` keyword:
Either _integer_ or _array_ of `[offset, limit]`
```
"limit": 50,
```
```
"limit": [100,50],
```
### `return`keyword:
_string_ with default value of `string` if omitted.
`string` Returns a _string_ of the generated query. Useful for debugging.
`array` Returns _array_ of rows, where each row is`{column: value, ...}`  _objects_.
`array-num` Returns _array_ of rows, where each row is a numeric _array_
`row` Returns _object_ of a single row `{column: value, ...}`
`row-num` Returns a single row, as a numeric _array_ `[0: value, 1: value, ...]`
`map` Returns _array_ of `{column: value}`  _object_ where the identifier is the first column in the result set, and the value is the second.
`map-array` Returns _object_ of `{identifier: {column: value, ...}}`, where the identifier is the first column in the result set, and the value an _object_ of `{name:value}` pairs.
`val` Returns a single value, of the first column of the first row.
`col` Returns an _array_ from the first column of each row `[0: value, 1: value, ...]`
`count` Number of rows returned/affected.
## Complete payload example
Example of a typical payload.
```
{
	"select": {
		"table": {"users": "user"},
		"columns": [
			"user.id",
			"user.name",
			"YEAR(user.date_added) AS year_added"
		]
	},
	"joins": [
		{
			"type": "inner",
			"table": {"salaries": "salary"},
			"conditions": [
				["salary.user_id", "=", "user.id"]
			]
		}
	],
	"where": [
		["salary.amount", ">", 100],
		["user.first_name", "!=", "?"]
	],
	"group": [
		"user.id"
	],
	"order": [
		{"salary.amount": "DESC"},
		"user.name"
	],
	"limit": 10,
	"params": [
		"Sam"
	],
	"return": "string"
}
```
Which will return the following:
```
SELECT `user`.`id`, `user`.`name`, YEAR(`user`.`date_added`) AS `year_added`
FROM `users` AS `user`
INNER JOIN `salaries` AS `salary` ON `salary`.`user_id` = `user`.`id`
WHERE `salary`.`amount` > 100
AND `user`.`first_name` != 'Sam'
GROUP BY `user`.`id`
ORDER BY `salary`.`amount` DESC, `user`.`name`
LIMIT 10
```
