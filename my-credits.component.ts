import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { ApiUrlService } from 'src/app/services/common/apiUrl/api-url.service';
import { HttpService } from 'src/app/services/common/http/http.service';

import { StripeService, StripeCardComponent, ElementOptions, ElementsOptions, Token } from 'ngx-stripe';
import { CommonService } from 'src/app/services/common/common.service';
declare var $: any;

export interface StripeToken {
  token: string;
  name: string;
}

export interface Credits {
  name: string;
  value: number;
  number: number;
}

export interface CredtisPrice {
  numberOfCredits: number;
  priceOfCredits: number;
}

@Component({
  selector: 'app-my-credits',
  templateUrl: './my-credits.component.html',
  styleUrls: ['./my-credits.component.scss']
})
export class MyCreditsComponent implements OnInit {
  @ViewChild(StripeCardComponent, { static: false }) card: StripeCardComponent;
  status: Token;
  currentCredits: number;
  cardOptions: ElementOptions;
  elementsOptions: ElementsOptions;
  credits: any[] = [];
  selectedPlan: any;
  creditForm: any;
  StripeForm: any;
  selectedCredits: any;
  constructor(
    private formBuilder: FormBuilder,
    private https: HttpService,
    private apiUrl: ApiUrlService,
    private stripeService: StripeService,
    private commonService: CommonService) { }

  ngOnInit(): void {
    this.currentCredits = JSON.parse(localStorage.userDetails).user.credits >= 0 ?
      JSON.parse(localStorage.userDetails).user.credits : 0;
    this.OnPageLoad();
  }

  // things that needed on page loader.
  // stripe design configuration.
  // formbuilder for credits form.

  OnPageLoad() {
    this.creditForm = this.formBuilder.group({
      plan: ['', [Validators.required]]
    });
    this.cardOptions = {
      style: {
        base: {
          iconColor: '#666EE8',
          color: '#31325F',
          lineHeight: '50px',
          fontWeight: 400,
          fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
          fontSize: '18px',
          '::placeholder': {
            color: 'black'
          }
        }
      }
    };
    this.elementsOptions = {
      locale: 'en'
    };
    this.StripeForm = this.formBuilder.group({
      name: ['', Validators.compose([Validators.required])]
    });
    this.https.httpGetwithHeaders(this.apiUrl.creditsPlans,
      { headers: { Authorization: JSON.parse(localStorage.userDetails).token } })
      .subscribe(
        (response: any) => {
          if (response.success) {
            if (response.result.length > 0) {
              this.setCredits(response.result);
            }
          }
        }, (error: any) => {
          this.commonService.presentToast('error', 'top-end', `Something's went wrong!`);
        });
  }

  // set credit plans in array Obj.
  // set value after customizing in setcredits function.

  setCredits(CreditPlans: Array<CredtisPrice>) {
    CreditPlans.filter((item: CredtisPrice) => {
      if (item.numberOfCredits === 20) {
        this.credits.push({
          name: item.numberOfCredits + ' credits for $' + item.priceOfCredits + ' (recommended)',
          value: item.priceOfCredits,
          number: item.priceOfCredits
        });
      } else if (item.numberOfCredits === 70) {
        this.credits.push({
          name: item.numberOfCredits + ' credits for $' + item.priceOfCredits + ' (most popular choice)',
          value: item.priceOfCredits,
          number: item.priceOfCredits
        });
      } else {
        this.credits.push({
          name: item.numberOfCredits + ' credits for $' + item.priceOfCredits,
          value: item.priceOfCredits,
          number: item.priceOfCredits
        });
      }
    });
  }

  // Set plans details in selectedCredits Object.
  // show the price in card popup.

  onselectCreditPlan(plan: number) {
    this.selectedPlan = plan;
    this.credits.filter(x => {
      if (x.value === plan) {
        this.selectedCredits = x.number;
      }
    });
  }

  oncheck(data: StripeToken) {
    const reqObj = {
      token: data.token,
      amount: this.selectedPlan,
      artistId: JSON.parse(localStorage.userDetails).user._id,
      name: data.name,
      credits: this.selectedCredits
    };
    this.https.httpPostwithHeader(this.apiUrl.buyCredits, reqObj,
      { headers: { Authorization: JSON.parse(localStorage.userDetails).token } })
      .subscribe((response: any) => {
        if (response) {
          // hide the card popup and show success message if payment is succeed.
          // show success message of how many credits are bought.
          $('#paymentPopup').modal('hide');
          const text = response.credits > 1 ? 'credits' : 'credit';
          this.commonService.presentToast('success', 'top-end', 'Congratulations! Your payment was approved');
          this.creditForm.reset();
          this.selectedPlan = false;
        }
      },
        (error: any) => {
          // handle error if there is any error in stripe payment and post payment details.
          // show handled error messages  in toaster.
          if (error.raw.code === 'card_declined') {
            this.commonService.presentToast('error', 'top-end', 'Your credit card was declined. Please try another payment method.');
          } else {
            this.commonService.presentToast('error', 'top-end', error.raw.message);
          }
        });
  }

  // proceed a payment if card is valid and token is generated successfully for further actions.
  // check if the cards details are valid and stripe creates token for proceeding payments.
  // validate card fields.

  makePayment() {
    this.commonService.loader(true);
    if (this.StripeForm.value.name === '') {
      return false;
    }
    this.stripeService.createToken(this.card.getCard(), { name })
      .subscribe((result: any) => {
        this.commonService.loader(false);
        if (result.token) {
          const data = {
            token: result.token.id,
            name: this.StripeForm.value.name
          };
          this.oncheck(data);
        } else if (result.error) {
          this.commonService.loader(false);
          this.commonService.presentToast('error', 'top-end', result.error.message);
        }
      }, (error: any) => {
        this.commonService.loader(false);
        this.commonService.presentToast('error', 'top-end', error.code);
      });
  }

  // check if the credit form is valid and show the payment popup for entering details.
  onSubmit() {
    if (this.creditForm.invalid) {
      return false;
    } else {
      $('#paymentPopup').modal('show');
    }
  }
}
