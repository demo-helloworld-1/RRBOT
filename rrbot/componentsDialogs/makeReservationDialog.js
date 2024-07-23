//Defining Waterfall Dialog and Components using botbuilder-dialogs
const {WaterfallDialog, ComponentDialog,DialogSet,DialogTurnStatus} = require('botbuilder-dialogs');

//Defining different types of prompts that we are using in waterfall dialog
const{ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt}= require('botbuilder-dialogs');

//Dialog Set defining. 
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const DATETIME_PROMPT = 'DATETIME_PROMPT ';
const NUMBER_PROMPT = 'NUMBER_PROMPT ';
const TEXT_PROMPT = 'TEXT_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
var endDialog='';

//Here we create a class for make reservation using extension of Components Dialog
class MakeReservationDialog extends ComponentDialog{
    constructor(conversationState,userState){
        super('makeReservationDialog');//Dialog ID for class 

        
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT),this.noOfParticipantsValidator);
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new DateTimePrompt(DATETIME_PROMPT));

        //Gather information from user.
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG,[
            this.firstStep.bind(this),
            this.getName.bind(this),// Get name from user
            this.getNumberofParticipants.bind(this), // Number of participants for reservation
            this.getDate.bind(this),//Date of reservation
            this.getTime.bind(this),//Time of reservation
            this.confirmStep.bind(this),//Show Summary of values entered by user and ask confirmation to make reservation
            this.summaryStep.bind(this)
            
        ]));

        // this.firstStep.bind(this),//Ask confirmation if user wants to make reservations?
            this.initialDialogId =  WATERFALL_DIALOG;
    }

    //To trigger this dialog from the main dialog (rrbot.js), main dialog will use a run helper function to access the componentDialog
    async run(turnContext, accessor){
        // console.log("run method invoked");

        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);
        const dialogContext = await dialogSet.createContext(turnContext);

        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty){
            console.log("Empty Status");
            await dialogContext.beginDialog(this.id);
        }
    }

    async firstStep(step) {
        endDialog = false;
        console.log("first step called")
        try {
            return await step.prompt(CONFIRM_PROMPT, "Would you like to make a reservation?", ['Yes', 'No']);
        } catch (error) {
            // Handle errors during the prompt 
            console.error('Error in firstStep:', error);
            await step.context.sendActivity("Oops, something went wrong. Please try again.");
            return await step.endDialog(); 
        }
    }

    async getName(step){
        
        if(step.result === true){
            return await step.prompt(TEXT_PROMPT,'In what name reservation is to be made?')
        }
    }

    async getNumberofParticipants(step){
        step.values.name = step.result
        return await step.prompt(NUMBER_PROMPT,'How many participants(0-150)?');
    }

    async getDate(step){
        step.values.noOfParticiapnts = step.result
        return await step.prompt(DATETIME_PROMPT,'On which date you want to make the reservation?');
    }

    async getTime(step){
        step.values.date = step.result
        return await step.prompt (DATETIME_PROMPT, 'At what time?') 
    }

    async confirmStep(step){
        step.values.time = step.result

        var msg = ` Here is the summary for your reservations: \n Name: ${step.values.name}\n Number of participants: ${step.values.noOfParticiapnts},\n
        Date: ${JSON.stringify(step.values.date)} \n Time: ${JSON.stringify(step.values.time)}`

        await step.context.sendActivity(msg);

        return await step.prompt(CONFIRM_PROMPT,"Please confirm your details and want to make the reservation",['Yes','No']);
    }

    async summaryStep(step){
        if(step.result===true){
            //Business Logic to create an reservation for Database
            await step.context.sendActivity("Reservation successfull made, Here is the confirmation with your reservation ID: 45678765")
            endDialog = true;
            return await step.endDialog();
        }
    }

    async noOfParticipantsValidator(promptContext){
        return promptContext.recognized.succeeded && promptContext.recognized.value >1 && promptContext.recognized.value <150;
    }

    async isDialogComplete(){
        return endDialog;
    }
    
  
}

module.exports.MakeReservationDialog = MakeReservationDialog;





