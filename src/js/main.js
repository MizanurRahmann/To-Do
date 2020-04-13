var todoController = (function(){  
    var todo = function(id, description){
        this.id = id;
        this.description = description;
    }
    var done = function(id, description){
        this.id = id;
        this.description = description;
    }
    var data = {
        todo: [],
        done: [],
        previousPercentage: 0,
        CurrentPercentage: 0,
    }

    return{
        addItem: function(type, des){
            var ID, newTask;

            if(data[type].length > 0)
                ID = data[type][data[type].length - 1].id + 1;
            else
                ID = 0;

            if(type == 'todo')
                newTask = new todo(ID, des);
            else
                newTask = new done(ID, des);
            
            data[type].push(newTask);
            return newTask;
        },
        deleteItem: function(type, id){
            var allIds = data[type].map(function(current){
                return current.id;
            });
            var index = allIds.indexOf(id);
            if(index !== -1){
                var deletedItem = data[type].splice(index, 1);
            }
            return deletedItem;
        },
        getTaskProgress: function(){
            var parcentage = 0;
            if(data.done.length > 0){
                parcentage = Math.round((data.done.length / (data.todo.length + data.done.length)) * 100);
            }
            data.previousPercentage = data.CurrentPercentage;
            data.CurrentPercentage = parcentage;
            return {pre: data.previousPercentage, cur: data.CurrentPercentage};
        },
        testing: function(){
            console.log(data);
        }
    }
})();





var uiController = (function(){
    var DomStrings = {
        inputButton: '.common_btn',
        taskDescription: '.input_description',
        taskContainer: '.todo_list_items',
        taskToDo: '.task_todo',
        taskDone: '.task_done',
        container: '#todo',
        circle: '#circle',
        percentage:'#percent',
        date: '.date'
    }

    return{
        getInput: function(){
            var description = document.querySelector(DomStrings.taskDescription).value;
            return description;
        },
        getDomStrings: function(){
            return DomStrings;
        },
        addTaskItem: function(type, obj){
            //Crete a html string
            var html = '<div class="todo_list_item" id="%type%-%id%"><div class="item_check"><div class="item_check_box"></div></div><div class="item_description"><p>%description%</p></div><div class="item_delete_btn"><img src="./img/rubbish.svg"></div></div>';
            //Replace placeholer with actual data
            html = html.replace('%type%', type);
            html = html.replace('%id%', obj.id);
            html = html.replace('%description%', obj.description);
            //Insert the html into dom
            document.querySelector(DomStrings.taskContainer).insertAdjacentHTML('beforeend', html);
        },
        addPercentage: function(previousPercent, Currentpercent){
            var Circle = document.querySelector(DomStrings.circle);
            var Text = document.querySelector(DomStrings.percentage);
            
            var Angle = previousPercent * (439.824/100);
            var Percentage = Currentpercent * (439.824/100);
            
            window.timer = window.setInterval(function () {
                Circle.setAttribute("stroke-dasharray", Angle + ", 439.8226");
                // Text.innerHTML = parseInt((Angle)*(100/439.824)) + "%";
                
                if(previousPercent <= Currentpercent){
                    Angle += .5;
                    if (Angle >= Percentage){
                        window.clearInterval(window.timer);
                    }
                } else{
                    Angle -= .5;
                    if (Angle <= Percentage){
                        window.clearInterval(window.timer);
                    }
                }
              }.bind(this), 1);
              Text.innerHTML = Currentpercent + "%";
        },
        deleteTaskItem: function(selectorId){
            var element = document.getElementById(selectorId);
            element.parentNode.removeChild(element);
        },
        displayDate: function(){
            var now = new Date();
            var month = now.getMonth();
            var date = now.getDate();

            var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            document.querySelector(DomStrings.date).textContent = months[month] + ' ' + date;
        },
        clearFields: function(){
            document.querySelector(DomStrings.taskDescription).value = "";
        }
    }
})();




var controller = (function(todoCtrl, uiCtrl){
    var SetupEventListner = function(){
        var DOM = uiCtrl.getDomStrings();
        document.querySelector(DOM.taskToDo).addEventListener('click', updateProgress);
        document.querySelector(DOM.taskDone).addEventListener('click', updateProgress);

        document.querySelector(DOM.container).addEventListener('click', deleteOrToggle);

        document.querySelector(DOM.inputButton).addEventListener('click', ctrlTheSystem);
        document.addEventListener('keypress', function(event){
            if(event.keyCode === 13 || event.which === 13)
                ctrlTheSystem(event);
        });
    }

    var deleteOrToggle = function(){
        //Get the id of current item
        var itemId = event.target.parentNode.parentNode.id;
        var splitId = itemId.split('-');
        var type = splitId[0];
        var ID = parseInt(splitId[1]);

        if(event.target.parentNode.classList != "item_delete_btn" && (
            event.target.parentNode.parentNode.classList == 'todo_list_item' || 
            event.target.parentNode.parentNode.classList == 'todone_list_item')){
                //Toggle the item
                var changedTask = toggleTaskItem(ID, type);
                //Change UI
                if(type == 'todo'){
                    event.target.parentNode.parentNode.id = "done-"+changedTask.id;
                    event.target.parentNode.parentNode.classList = 'todone_list_item';
                } else{
                    event.target.parentNode.parentNode.id = "todo-"+changedTask.id;
                    event.target.parentNode.parentNode.classList = 'todo_list_item';
                }
                //Update percentage
                updateProgress();

        } else if(event.target.parentNode.classList == "item_delete_btn"){
            //Delte task item
            todoCtrl.deleteItem(type, ID);
            //Update UI
            uiCtrl.deleteTaskItem(itemId);
            //Update percentage
            updateProgress();
        }
    }

    var toggleTaskItem = function(id, type){
        //delete from current dataset
        var deletedItem = todoCtrl.deleteItem(type, id);
        //add to other data set
        if(type=="todo"){
            addedTo = "done";
        } else{
            addedTo = "todo";
        }
        var changedTask = todoCtrl.addItem(addedTo, deletedItem[0].description);
        return changedTask;
    }

    var updateProgress = function(event=null){
        //Get percentage
        var percentages = todoCtrl.getTaskProgress();
        //Update UI
        var updateType;
        if(event){
            if(event.target.classList == 'task_todo'){
                //Clear the other ID
                document.querySelector(".task_done").id = "";
                //Set active to current id
                event.target.id = "active";
                //return type
                updateType =  "todo";
            } else{
                //Clear the other ID
                document.querySelector(".task_todo").id = "";
                //Set active to current id
                event.target.id = "active";
                //return type
                updateType = "done";
            }
        }
        else{
            if(document.querySelector(".task_todo").id == 'active'){
                updateType = "todo";
            } else{
                updateType = "done";
            }
        }
    
        if(updateType == 'done'){
            uiCtrl.addPercentage(percentages.pre, percentages.cur);
        } else{
            uiCtrl.addPercentage(100 - percentages.pre, 100 - percentages.cur);
        }
    }


    var ctrlTheSystem = function(event){
        event.preventDefault();
        //1. Get the field input data
        var data = uiCtrl.getInput();
        if(data != ""){
            //2. Add item to todo list
            var newTask = todoCtrl.addItem("todo", data);
            //3. Add item to the UI
            uiCtrl.addTaskItem("todo" ,newTask);
            // 4. Clear the field
            uiCtrl.clearFields();
            //Update percentage
            updateProgress()
            
        }
    };

    return{
        init: function(){
            SetupEventListner();
            uiController.displayDate();
            uiCtrl.addPercentage(0, 0);
        }
    }

})(todoController, uiController);

controller.init();