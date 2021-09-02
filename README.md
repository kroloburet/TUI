<!-- Developer: Sergey Nizhnik kroloburet@gmail.com -->

# TUI фреймворк

Это мини фреймворк с набором CSS3 классов и сценария на нативном javaScript для создания простых, адаптивных
веб-интерфейсов. Он подойдет для тех, кто не хочет <q>тащить</q> в проект монстров типа Bootstrap с их зависимостями.
Если ты любишь адаптивную, выразительную верстку без верениц классов и работающие <q>из коробки</q> веб-компоненты типа
табов или многоуровневого меню без поиска и подключения дополнительных плагинов, TUI станет приемлемой отправной точкой.
Расширяй TUI если хочешь больше возможностей.

## Примеры и документация

[https://kroloburet.github.io/TUI](https://kroloburet.github.io/TUI)

## Подключение TUI

1. [Загрузи архив](https://github.com/kroloburet/TUI/archive/refs/heads/main.zip) с TUI и распакуй его или
   клонируй: `https://github.com/kroloburet/TUI.git`
2. Подключи в документ `TUI.css`, `TUI.js`, `fontawesome` как в примере ниже.
   ```
   <!doctype html>
   <html lang="en">
   <head>
       <meta charset="UTF-8">
       <meta name="viewport" content="width=device-width, initial-scale=1">
       <meta http-equiv="X-UA-Compatible" content="ie=edge">
       <!-- TUI CSS -->
       <link href="TUI.css" rel="stylesheet">
       <!-- TUI js -->
       <script src="TUI.js" defer></script>
       <!-- FontAwesome -->
       <script src="https://kit.fontawesome.com/yourKey.js" defer></script>
       <title>Document</title>
   </head>
   <body>
       <button type="button" onclick="TUI.Popup('myPop')">Click My</button>
       <div id="myPop" class="TUI_Popup">
           <h3>Hello, World!</h3>
       </div>
   </body>
   </html>
   ```

## Лицензия

Свободная лицензия [MIT license](https://opensource.org/licenses/MIT).

***
<img src="https://raw.githubusercontent.com/kroloburet/TUI/main/imgs/i.jpg"> kroloburet@gmail.com