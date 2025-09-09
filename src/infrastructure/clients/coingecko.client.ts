import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class CoingeckoClient {
	private readonly baseUrl = 'https://api.coingecko.com/api/v3';

	async getPrice(coinId: string, vsCurrency: string): Promise<number> {
		try {
			const response = await axios.get(`${this.baseUrl}/simple/price`, {
				params: {
					ids: coinId,
					vs_currencies: vsCurrency,
				},
			});
			// Örnek yanıt: { "bitcoin": { "usd": 60000 } }
			return response.data[coinId][vsCurrency];
		} catch (error) {
			console.error('Coingecko API Hatası:', error);
			throw new Error('Fiyat verisi alınamadı.');
		}
	}
}
