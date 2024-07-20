import { LightningElement, track } from 'lwc';
import { createRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class CustomShipmentCreator extends LightningElement {
    @track shipmentName = '';
    @track lineItems = [];
    @track isSubmitDisabled = true;

    handleShipmentNameChange(event) {
        this.shipmentName = event.target.value;
        console.log('shipmentname: '+this.shipmentName);
        this.checkSubmitButton();
    }

    handleLineItemNameChange(event) {
        const index = event.target.dataset.index;
        console.log('index: ',this.index);
        this.lineItems[index].name = event.target.value;
        console.log('lineItems:',this.lineItems);
        this.checkSubmitButton();
    }

    handleAddLine() {
        const newLine = {
            id: Date.now(),
            title: `Line Item ${this.lineItems.length + 1}`,
            name: ''
        };
        console.log('new lines: ',this.newLine);
        this.lineItems = [...this.lineItems, newLine];
        console.log('handle addline line items: ' + JSON.stringify(this.lineItems));
        this.checkSubmitButton();
    }

    handleRemoveLine(event) {
        const index = event.target.dataset.index;
        console.log('index inside reomove line: ',this.index);
        this.lineItems = this.lineItems.filter((_, i) => i !== parseInt(index));
        // Update titles for remaining line items
        this.lineItems = this.lineItems.map((item, i) => ({
            ...item,
            title: `Line Item ${i + 1}`
        }));
        console.log('lineitems after remove: ',JSON.stringify(this.lineItems));
        this.checkSubmitButton();
    }

    checkSubmitButton() {
        if (this.lineItems.length === 0) {
            // If there are no line items, only check for shipment name
            this.isSubmitDisabled = !this.shipmentName;
        } else {
            // If there are line items, check shipment name and all line item names
            this.isSubmitDisabled = !this.shipmentName || this.lineItems.some(item => !item.name);
        }
    }

    handleSubmit() {
        // Create CustomShipment record
        const shipmentFields = { Name: this.shipmentName };
        createRecord({ apiName: 'CustomShipment__c', fields: shipmentFields })
            .then(shipment => {
                // Create CustomShipmentLine records
                const linePromises = this.lineItems.map(line => {
                    const lineItemFields = {
                        Name: line.name,
                        CustomShipment__c: shipment.id
                    };
                    return createRecord({ apiName: 'CustomShipmentLines__c', fields: lineItemFields });
                });
                return Promise.all(linePromises);
            })
            .then(() => {
                // Handle success
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Custom Shipment and Line Items created',
                        variant: 'success'
                    })
                );
                this.resetForm();
            })
            .catch(error => {
                // Handle error
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error creating records',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
    }

    resetForm() {
        this.shipmentName = '';
        this.lineItems = [];
        this.isSubmitDisabled = true;
        this.template.querySelectorAll('lightning-input').forEach(input => {
            input.value = '';
        });
    }
}