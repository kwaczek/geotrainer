export interface LicensePlateData {
  _id?: string;
  imageUrl: string;
  description: string;
  googleMapsUrl: string;
  countries: string[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export const plates: LicensePlateData[] = [
  {
    "_id": "67d45ee66e2c9db37438ed59",
    "imageUrl": "/uploads/licenseplates/1741971174056-598371510.png",
    "description": "fsdf",
    "googleMapsUrl": "http://18.185.224.209/",
    "countries": [
      "523af537946b79c4f8369ed3"
    ],
    "createdAt": "2025-03-14T16:52:54.069Z",
    "updatedAt": "2025-03-14T16:52:54.069Z",
    "__v": 0
  }
];