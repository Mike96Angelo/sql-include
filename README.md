# sql-include
A simple pre-processor for building sql from multiple files.

To include a `.sql` file:
```sql
-- @include ./path/to/file.sql
```

To include all `.sql` files in a folder:
```sql
-- @include ./path/to/dir
```

## example:

main.sql:
```sql
-- @include ./my_func.sql
select * from my_func();
```
my_func.sql:
```sql
create or replace function my_func() returns void as $$
declare
  -- variables go here
begin
  -- logic goes here
end;
$$ LANGUAGE plpgsql;
```

output.sql:
```sql
-- INCLUDE: ./my_func.sql

create or replace function my_func() returns void as $$
declare
  -- variables go here
begin
  -- logic goes here
end;

-- INCLUDE END;

select * from my_func();
```

file.js:
```JavaScript
var fs = require('fs');
var sqlInclude = require('sql-include');

fs.writeFileSync('./output.sql', sqlInclude('./main.sql'));
```
