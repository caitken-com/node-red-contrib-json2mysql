# JSON 2 MySQL for NodeRed

Takes *{JSON}* payloads which then creates and executes MySQL queries, that are sql injection safe, with automatic quoting for input params, and  automatic **\`table\`.\`column\`** back-ticking.

## Dependencies

- **MySQL server:** Here's a tutorial on installing for [Raspberry Pi](https://linuxhint.com/setup-mysql-raspberry-pi/).
- **Some prior knowledge:** Although I've changed certain keywords to simplify the json, some prior knowledge of MySQL is beneficial.


## Config node

Create a config node to connect to your database server

| Field | Comment |
|---|---|
| host | `your-domain/IP/localhost`. |
| database |  Name of database to connect. |
| user | Username to database. |
| password | Password to database. |


## Query node

This is the node you'll use in your flows to pass in *{JSON}* and receive *{string|array|object}* from the output.

| Field | Comment |
|---|---|
| name | (optional) Node label |
| server | Config node used for database connection. |
| template | (optional) JSON string to create static payloads. Input payload can override/appended via input payload. |

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

Example payload to append to the template:
```
{
	"params": {
		"first_name": "John"
	}
}
```

Example payload to override (where clause) of the template, the rest of the template will remain unchanged:
```
{
	"where": [
		["user.first_name", "is not", null]
	]
}
```


# Payload:

See documentation for available methods as [keywords within your payload](https://www.npmjs.com/package/@caitken-com/simple-sql-builder). (Note: `fromJson`)

## The `return` keyword:

Takes _{string}_ with value as any of the following to specify desired output of this node:

| Value | Comment |
|---|---|
| `string` |  Returns a _{string}_ of the generated query. Useful for debugging. |
| `array` | Returns _{object[]}_ of rows, where each row is `{column: value, ...}` |
| `array-num` | Returns _{array}_ of rows, where each row is a numeric _{array}_ |
| `row` | Returns _{object}_ of a single row `{column: value, ...}`. |
| `row-num` | Returns a single row, as a numeric _{array}_ `[0: value, 1: value, ...]` |
| `map` | Returns _{object[]}_ of `{column: value}` where the identifier is the first column in the result set, and the value is the second. |
| `map-array` | Returns _{object}_ of `{identifier: {column: value, ...}}`, where the identifier is the first column in the result set, and the value an _{object}_  of `{column: value}` pairs. |
| `val` | Returns a single value, of the first column of the first row. |
| `col` | Returns an _{array}_ from the first column of each row `[0: value, 1: value, ...]`. |
| `count` | Number of rows returned/affected. |

If omitted from payload the default return type is `string`.


## Complete payload example

Example of a typical payload.

```
{
	"select": {
		"table": {"users": "user"},
		"columns": [
			"user.id",
			"user.name",
			"YEAR(user.date_added) AS alumni"
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
SELECT `user`.`id`, `user`.`name`, YEAR(`user`.`date_added`) AS `alumni`
FROM `users` AS `user`
INNER JOIN `salaries` AS `salary` ON `salary`.`user_id` = `user`.`id`
WHERE `salary`.`amount` > 100
AND `user`.`first_name` != 'Sam'
GROUP BY `user`.`id`
ORDER BY `salary`.`amount` DESC, `user`.`name`
LIMIT 10
```
