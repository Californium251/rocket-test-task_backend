import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AmocrmService {
  constructor(private readonly httpService: HttpService) {}

  async getAmoData(query: any, token?: string) {
    if (token) {
      console.log('token passed');
    }
    const accessToken = token || `${process.env.ACCESS_TOKEN}`;
    const amoCrmUrl = process.env.AMOCRM_URL;
    try {
      const leads = await lastValueFrom(
        await this.httpService.get(`${amoCrmUrl}/api/v2/leads`, {
          params: { ...query, with: 'contacts' },
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );
      const getContactsIds = (data: any) => {
        const ids = data.map((deal: any) => {
          return `${deal.main_contact.id}`;
        });
        return ids.join(',');
      };
      const contacts = await lastValueFrom(
        await this.httpService.get(`${amoCrmUrl}/api/v2/contacts`, {
          params: { id: getContactsIds(leads.data._embedded.items) },
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );
      const statuses = await lastValueFrom(
        await this.httpService.get(`${amoCrmUrl}/api/v4/leads/pipelines`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );
      const deals = leads.data._embedded.items;
      const formatData = (
        data: Array<
          Partial<{
            name: string;
            sale: number;
            status_id: string;
            main_contact_id: string;
            crated_at: number;
          }>
        >,
      ) =>
        data.map((el: any) => {
          return {
            name: el.name,
            budget: el.sale.toLocaleString('ru-RU'),
            status:
              statuses.data._embedded.pipelines[0]._embedded.statuses.find(
                (status: any) => status.id === el.status_id,
              ).name,
            pta: contacts.data._embedded.items.find(
              (contact: any) => contact.id === el.main_contact.id,
            ).name,
            date: new Date(el.created_at * 1000).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }),
          };
        });
      return formatData(deals);
    } catch (error) {
      if (error.response.status === 401) {
        try {
          console.log('Token expired, refreshing...');
          const newToken = await lastValueFrom(
            await this.httpService.post(
              `${amoCrmUrl}/oauth2/access_token`,
              {
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: process.env.REFRESH_TOKEN,
                redirect_uri: process.env.REDIRECT_URI,
              },
              {
                headers: { 'Content-Type': 'application/json' },
              },
            ),
          );
          return await this.getAmoData(query, newToken.data.access_token);
        } catch (e) {
          console.log('Error refreshing token', e.message);
        }
      } else {
        throw new Error(`Error fetching data from amoCRM: ${error.message}`);
      }
    }
  }
}
